import { NextRequest, NextResponse } from "next/server";
import { generateSingleMeal } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const meal = await generateSingleMeal(body);
    return NextResponse.json({ meal });
  } catch (error) {
    console.error("Swap meal error:", error);
    return NextResponse.json({ error: "Failed to generate replacement meal" }, { status: 500 });
  }
}
