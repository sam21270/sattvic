import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";
import { toStrangerView } from "@/lib/socialView";

// GET /api/social/search?q=username
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  if (!q || q.length < 2) return NextResponse.json({ users: [] });

  await connectDB();

  // Search returns people you are not friends with yet, so it must not reveal
  // their real name, dosha or how they are doing — only enough to recognise
  // the account you meant to add.
  const users = await UserModel.find({
    username: { $regex: q, $options: "i" },
    email: { $ne: session.user.email },
    isPublic: true,
  })
    .select("username avatarEmoji bio")
    .limit(10)
    .lean();

  return NextResponse.json({ users: users.map(toStrangerView) });
}

