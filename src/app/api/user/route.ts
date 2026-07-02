import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";
import { checkNewBadges } from "@/lib/badges";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  await connectDB();
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "No email" }, { status: 400 });
  const user = await UserModel.findOne({ email }).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { email, score, grade, mealsLoggedToday, doshaResult, usedFridge, calculatedMacros, weekPlanned, proteinHit } = body;

  if (!email) return NextResponse.json({ error: "No email" }, { status: 400 });

  const user = await UserModel.findOne({ email });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  let newBadges: string[] = [];

  // ── streak logic ──────────────────────────────────────────────
  if (user.lastActiveDate !== today) {
    if (user.lastActiveDate === yesterday) {
      user.streak += 1;
    } else if (user.lastActiveDate && user.streakShield > 0) {
      // missed a day but has shield — preserve streak, burn shield
      user.streakShield -= 1;
      newBadges.push("shield_used");
    } else {
      user.streak = 1;
    }
    user.lastActiveDate = today;
  }

  // ── score history ─────────────────────────────────────────────
  if (score !== undefined) {
    const existing = user.scoreHistory.find((s: any) => s.date === today);
    if (existing) {
      existing.score = score;
      existing.grade = grade;
    } else {
      user.scoreHistory.push({ date: today, score, grade });
    }
    user.scoreHistory = user.scoreHistory
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
      .slice(0, 30);
    user.totalScore = Math.round(
      user.scoreHistory.reduce((s: number, h: any) => s + h.score, 0) / user.scoreHistory.length
    );
  }

  // ── dosha ─────────────────────────────────────────────────────
  if (doshaResult) user.doshaResult = doshaResult;

  // ── protein streak tracking ───────────────────────────────────
  const proteinStreakKey = "protein_streak_count";
  let proteinStreak = (user as any)[proteinStreakKey] ?? 0;
  if (proteinHit) proteinStreak += 1; else proteinStreak = 0;
  (user as any)[proteinStreakKey] = proteinStreak;

  // ── badges ────────────────────────────────────────────────────
  const earnedNow = checkNewBadges(user.badges, {
    mealsLoggedToday: mealsLoggedToday ?? 0,
    doshaSet: !!user.doshaResult,
    streak: user.streak,
    score: score ?? 0,
    proteinStreak,
    usedFridge: !!usedFridge,
    calculatedMacros: !!calculatedMacros,
    usedShield: newBadges.includes("shield_used"),
    weekPlanned: !!weekPlanned,
  });

  user.badges = [...new Set([...user.badges, ...earnedNow, ...newBadges])];
  newBadges = [...new Set([...earnedNow, ...newBadges])];

  await user.save();
  return NextResponse.json({ user, newBadges });
}
