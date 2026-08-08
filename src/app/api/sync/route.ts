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

/** 2MB of serialised localStorage. A year of daily logging is well under 1MB. */
const MAX_SYNC_BYTES = 2_000_000;

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
  // ...and never accept an unbounded one. This writes straight into the user
  // document, so without a ceiling a signed-in client can grow that document
  // until Mongo's own 16MB limit rejects it — and every read of that account
  // gets slower long before it does. A year of logging is well under 1MB.
  // ponytail: measured on the serialised blob, which is what actually gets
  // stored. Raise MAX_SYNC_BYTES if a real account ever legitimately hits it.
  const bytes = JSON.stringify(data).length;
  if (bytes > MAX_SYNC_BYTES) {
    return NextResponse.json(
      { ok: false, reason: "too-large", bytes, limit: MAX_SYNC_BYTES },
      { status: 413 },
    );
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
