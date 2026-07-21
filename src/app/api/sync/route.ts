import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";

// Cross-device sync of the whole `sattvic*` localStorage namespace.
// ponytail: uses ?email= like every other route here; verify the session
// server-side (getServerSession) once the whole API surface moves off email params.

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  await connectDB();
  const user = await User.findOne({ email }).select("syncData syncUpdatedAt").lean() as any;
  return NextResponse.json({ data: user?.syncData ?? null, updatedAt: user?.syncUpdatedAt ?? 0 });
}

export async function POST(req: NextRequest) {
  const { email, data, updatedAt } = await req.json();
  if (!email || !data || typeof data !== "object" || typeof updatedAt !== "number") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  // never accept an empty blob — protects against a fresh device clobbering data
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, reason: "empty" });
  }

  await connectDB();
  const existing = await User.findOne({ email }).select("syncUpdatedAt");
  if (existing && (existing.syncUpdatedAt ?? 0) > updatedAt) {
    // server has newer data — reject stale write, tell client to re-pull
    return NextResponse.json({ ok: false, stale: true, updatedAt: existing.syncUpdatedAt });
  }
  await User.updateOne({ email }, { $set: { syncData: data, syncUpdatedAt: updatedAt } });
  return NextResponse.json({ ok: true, updatedAt });
}
