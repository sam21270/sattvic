import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { ingredients, jain = false } = await req.json();

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a creative vegetarian chef. The user has these ingredients: ${ingredients}${jain ? "\n\nSTRICT JAIN DIET: absolutely no onion, garlic, ginger, potato, carrot, radish, beetroot or any root vegetable; no mushrooms or fungi; no eggs; no honey." : ""}

Suggest exactly 3 vegetarian meals they can make RIGHT NOW using mostly these ingredients (they can use basic pantry staples like salt, oil, spices).

Return ONLY valid JSON array with this structure:
[
  {
    "name": "meal name",
    "description": "one enticing sentence",
    "emoji": "single relevant emoji",
    "prepTime": number (minutes),
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "usesFrom": ["ingredient1", "ingredient2"],
    "extraNeeded": ["optional pantry item"],
    "instructions": ["step1", "step2", "step3", "step4"]
  }
]`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Fridge error:", error);
    return aiErrorResponse(error, "Failed to generate meals");
  }
}
