import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/errors";
import { generateMealSuggestions } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const suggestions = await generateMealSuggestions(body);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggestion error:", error);
    return aiErrorResponse(error, "Failed to generate suggestions");
  }
}
