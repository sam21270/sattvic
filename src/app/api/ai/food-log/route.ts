import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return NextResponse.json({ error: "Describe what you ate" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a clinical nutritionist with deep knowledge of Indian food portions (roti, dal, sabzi, paneer gravy, rice by the katori/cup) as well as global foods. A user describes what they ate in plain language. Estimate the nutrition of each item using standard portion sizes (1 roti ≈ 40g, 1 cup cooked rice ≈ 160g, 1 katori dal ≈ 150ml, etc.) and ICMR/USDA nutrient values.

User ate: "${text.trim()}"

Return ONLY valid JSON, no markdown, with this exact structure:
{
  "items": [
    {
      "name": "cleaned item name with quantity, e.g. '2 rotis'",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number },
  "note": "one short helpful sentence about this meal (protein quality, fiber, a gentle suggestion) — friendly, not preachy"
}

All numbers are integers. If an item is ambiguous, assume the most common Indian home-cooked version. If something isn't food, skip it.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    return NextResponse.json(JSON.parse(json));
  } catch (error) {
    console.error("Food log error:", error);
    return NextResponse.json({ error: "Failed to analyze food" }, { status: 500 });
  }
}
