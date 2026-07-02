import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { MealPlan } from "@/models/MealPlan";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "guest";
    const week = searchParams.get("week");

    const filter: Record<string, unknown> = { userId };
    if (week) filter.week = week;

    const plans = await MealPlan.find(filter).populate("days.breakfast days.lunch days.dinner days.snacks").lean();
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Meal plan fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch meal plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const plan = await MealPlan.findOneAndUpdate(
      { userId: body.userId, week: body.week },
      body,
      { upsert: true, new: true }
    );
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Meal plan save error:", error);
    return NextResponse.json({ error: "Failed to save meal plan" }, { status: 500 });
  }
}
