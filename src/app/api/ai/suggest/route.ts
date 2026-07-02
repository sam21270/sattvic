import { NextRequest, NextResponse } from "next/server";
import { generateMealSuggestions } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const suggestions = await generateMealSuggestions(body);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggestion error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
