import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { mealName } = await req.json();
  if (!mealName?.trim()) return NextResponse.json({ error: "No meal name" }, { status: 400 });

  const prompt = `You are a nutrition database. Return accurate nutrition data for ONE standard restaurant/home serving of: "${mealName}"

Respond with ONLY valid JSON, no explanation, no markdown:
{
  "name": "proper dish name",
  "description": "one sentence describing the dish and its origin",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "servingSize": "e.g. 1 bowl (350g) or 1 plate (400g)"
}

Rules:
- Use realistic home/restaurant portion sizes (not tiny diet portions)
- All numbers are integers
- Base on standard Indian/international recipes
- If unsure, give realistic estimates — do NOT refuse`;

  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not estimate nutrition" }, { status: 500 });
  }
}
