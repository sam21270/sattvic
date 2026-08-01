import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";
import { weeklyScore, todayScore } from "@/lib/socialView";

// GET /api/social/profile/[username]
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  await connectDB();

  // Anyone on the internet can open this URL, so it carries the least: no real
  // name, no dosha (health-adjacent), and no day-by-day history.
  const user = await UserModel.findOne({ username: username.toLowerCase(), isPublic: true })
    .select("username avatarEmoji bio streak scoreHistory createdAt")
    .lean() as any;

  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({
    username: user.username,
    avatarEmoji: user.avatarEmoji ?? "🧘",
    bio: user.bio ?? "",
    streak: user.streak ?? 0,
    todayScore: todayScore(user.scoreHistory ?? []),
    weeklyScore: weeklyScore(user.scoreHistory ?? []),
    memberSince: user.createdAt,
  });
}
