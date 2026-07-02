import { NextRequest, NextResponse } from "next/server";
import { calculateMacros } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const macros = calculateMacros(body);
    return NextResponse.json(macros);
  } catch (error) {
    console.error("Macro calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate macros" }, { status: 500 });
  }
}
