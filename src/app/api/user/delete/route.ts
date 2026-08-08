import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

/**
 * Delete the signed-in account.
 *
 * The privacy policy promises deletion on request, and until now that promise
 * rested on someone running scripts/delete-user.mjs by hand. This is the same
 * work, done by the app: same order, same verification.
 *
 * Whose account this deletes comes from the session and nothing else. There is
 * deliberately no id or email parameter — an endpoint that deletes whoever the
 * caller names is the same IDOR shape this codebase has already been bitten by.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await UserModel.findOne({ email: session.user.email }).select("_id");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // References first, so nothing is left pointing at an account that is gone —
  // orphaned ids are why "deleted" people kept appearing in other users' lists.
  await UserModel.updateMany(
    { $or: [{ friends: user._id }, { "friendRequests.from": user._id }] },
    { $pull: { friends: user._id, friendRequests: { from: user._id } } },
  );
  await UserModel.deleteOne({ _id: user._id });

  // Say whether it actually all went, rather than assuming it did.
  const remaining = await UserModel.countDocuments({
    $or: [{ _id: user._id }, { friends: user._id }, { "friendRequests.from": user._id }],
  });

  return NextResponse.json({ ok: remaining === 0, remaining });
}
