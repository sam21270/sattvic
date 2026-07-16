import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { craving, allergies = [], conditions = [], jain = false } = await req.json();

    if (!craving) return NextResponse.json({ error: "No craving provided" }, { status: 400 });

    const allergyNote = allergies.length ? ` Exclude: ${allergies.join(", ")}.` : "";
    const conditionNote = conditions.length ? ` Safe for: ${conditions.join(", ")}.` : "";

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a creative vegetarian chef who specialises in making junk food cravings guilt-free. Someone is craving: "${craving}".${jain ? "\n\nSTRICT JAIN DIET: absolutely no onion, garlic, ginger, potato, carrot, radish, beetroot or any root vegetable; no mushrooms or fungi; no eggs; no honey." : ""}

Create a healthier vegetarian version of this dish.${allergyNote}${conditionNote}

Rules:
- 100% vegetarian (no meat, no fish)
- Significantly healthier than the original (lower calories, better ingredients, less processed)
- Still delicious and satisfying — not a sad salad, a proper meal
- Include real swaps that make it healthier (e.g. cauliflower base instead of refined flour pizza dough)

Return ONLY valid JSON:
{
  "name": "creative name for the healthy version",
  "tagline": "one punchy sentence selling this version",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "servings": number,
  "calories": number,
  "originalCalories": number,
  "macros": { "protein": number, "carbs": number, "fat": number, "fibre": number },
  "keySwaps": [
    { "original": "original ingredient", "swap": "healthier swap", "why": "one-line reason" }
  ],
  "ingredients": ["amount ingredient"],
  "steps": ["step 1", "step 2", "step 3"],
  "healthScore": number,
  "tags": ["tag1", "tag2"]
}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return NextResponse.json(JSON.parse(json));
  } catch (error) {
    console.error("Junk error:", error);
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}
