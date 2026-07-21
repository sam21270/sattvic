import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";

const MODEL = "llama-3.3-70b-versatile";

// Suggest meals for the REST of today that fill the remaining calorie/protein
// budget. Advisory only — the user need not log them.
export async function POST(req: NextRequest) {
  try {
    const { remainingCalories, remainingProtein, eaten } = await req.json();
    const cal = Math.round(Number(remainingCalories) || 0);
    const prot = Math.round(Number(remainingProtein) || 0);

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `A person is tracking their day. So far they ate: ${Array.isArray(eaten) && eaten.length ? eaten.join(", ") : "nothing yet"}.
To hit their goal they have about ${cal} kcal and ${prot}g protein LEFT for the rest of today.

Suggest 2-3 vegetarian meals/snacks for the rest of the day whose calories ADD UP to roughly ${cal} kcal and together supply close to ${prot}g protein. Prioritise protein since that's usually the hard target. Real, simple Indian-friendly foods.

Return ONLY a JSON array, no markdown:
[{ "name": "meal with portion, e.g. '2 rotis + paneer bhurji'", "calories": number, "protein": number }]
Integers. The calories should sum to about ${cal}.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
    return NextResponse.json({ meals: JSON.parse(json) });
  } catch (error) {
    console.error("Rest-of-day error:", error);
    return aiErrorResponse(error, "Failed to suggest meals");
  }
}
