import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

// GET /api/social/profile/[username]
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  await connectDB();

  const user = await UserModel.findOne({ username: username.toLowerCase(), isPublic: true })
    .select("username name avatarEmoji bio doshaResult totalScore streak badges scoreHistory createdAt")
    .lean() as any;

  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const weeklyScore = (user.scoreHistory ?? [])
    .filter((h: any) => new Date(h.date) >= cutoff)
    .reduce((s: number, h: any) => s + h.score, 0);

  return NextResponse.json({
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    avatarEmoji: user.avatarEmoji ?? "🧘",
    bio: user.bio ?? "",
    dosha: user.doshaResult?.dosha ?? null,
    totalScore: user.totalScore ?? 0,
    weeklyScore,
    streak: user.streak ?? 0,
    badges: user.badges ?? [],
    scoreHistory: (user.scoreHistory ?? []).slice(-30),
    memberSince: user.createdAt,
  });
}
