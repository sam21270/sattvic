import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

// GET /api/social/search?q=username
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  if (!q || q.length < 2) return NextResponse.json({ users: [] });

  await connectDB();

  const users = await UserModel.find({
    username: { $regex: q, $options: "i" },
    email: { $ne: session.user.email },
    isPublic: true,
  })
    .select("username name avatarEmoji bio doshaResult totalScore streak badges scoreHistory")
    .limit(10)
    .lean() as any[];

  return NextResponse.json({ users: users.map((u) => ({
    id: u._id.toString(),
    username: u.username,
    name: u.name,
    avatarEmoji: u.avatarEmoji ?? "🧘",
    bio: u.bio ?? "",
    dosha: (u.doshaResult as any)?.dosha ?? null,
    totalScore: u.totalScore ?? 0,
    streak: u.streak ?? 0,
    badges: u.badges ?? [],
    weeklyScore: weeklyScore(u.scoreHistory ?? []),
  })) });
}

function weeklyScore(history: { date: string; score: number }[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return history
    .filter((h) => new Date(h.date) >= cutoff)
    .reduce((s, h) => s + h.score, 0);
}
