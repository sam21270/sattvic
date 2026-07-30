import { NextRequest, NextResponse } from "next/server";
import { calculateMacros } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate before calculating: a missing field used to reach
    // input.activityLevel.toLowerCase() and surface as a 500, which reads as a
    // server fault rather than a bad request.
    const missing = (["weight", "height", "age", "gender", "activityLevel", "goal"] as const)
      .filter((k) => body?.[k] === undefined || body[k] === null || body[k] === "");
    if (missing.length) {
      return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
    }
    if (![body.weight, body.height, body.age].every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)) {
      return NextResponse.json({ error: "weight, height and age must be positive numbers" }, { status: 400 });
    }

    const macros = calculateMacros(body);
    return NextResponse.json(macros);
  } catch (error) {
    console.error("Macro calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate macros" }, { status: 500 });
  }
}
