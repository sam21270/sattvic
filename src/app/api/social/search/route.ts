import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";
import { toStrangerView, isValidUsername } from "@/lib/socialView";

// GET /api/social/search?q=username
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  if (!q || q.length < 2 || q.length > 20) return NextResponse.json({ users: [] });

  // The query used to go into $regex unescaped, so "." or ".*" matched every
  // account and dumped the whole user list, and "(a+)+$" pinned the CPU with
  // catastrophic backtracking. There is no regex any more: usernames are
  // [a-z0-9_], and lookup is an exact equality match. You can only find someone
  // whose username you already know — no browsing the user base by prefix.
  if (!isValidUsername(q)) return NextResponse.json({ users: [] });

  await connectDB();

  // Deliberately not filtered by isPublic: that flag governs the public /u/
  // page. Being findable by exact username is what makes adding a friend
  // possible at all, and this returns only username, avatar and bio — to a
  // signed-in caller, never anonymously.
  const users = await UserModel.find({
    username: q,
    email: { $ne: session.user.email },
  })
    .select("username avatarEmoji bio")
    .limit(5)
    .lean();

  return NextResponse.json({ users: users.map(toStrangerView) });
}

