import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Meal } from "@/models/Meal";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};
    if (searchParams.get("highProtein") === "true") filter.isHighProtein = true;
    if (searchParams.get("lowCarb") === "true") filter.isLowCarb = true;
    if (searchParams.get("tag")) filter.tags = searchParams.get("tag");

    const meals = await Meal.find(filter).limit(50).lean();
    return NextResponse.json(meals);
  } catch (error) {
    console.error("Recipes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const meal = await Meal.create(body);
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Recipe create error:", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
