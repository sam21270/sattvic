import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";

// Cross-device sync of the whole `sattvic*` localStorage namespace. Whose blob
// this reads or writes is decided by the session — a client-supplied email
// would let anyone pull another user's entire logged history.

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).select("syncData syncUpdatedAt").lean() as any;
  return NextResponse.json({ data: user?.syncData ?? null, updatedAt: user?.syncUpdatedAt ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const { data, updatedAt } = await req.json();
  if (!data || typeof data !== "object" || typeof updatedAt !== "number") {
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
