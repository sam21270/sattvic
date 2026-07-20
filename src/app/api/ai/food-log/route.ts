import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";

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

Method — for EVERY item: resolve the stated quantity into countable units first (slices, pieces, cups — "half a LARGE pizza" = 4 slices; mixed dishes like khichdi use plates/bowls), WRITE that count into the item name (e.g. "half large veggie pizza (4 slices)"), then calories = count × per-unit value. Never guess a total directly.
Magnitude calibration (two ends of the scale): 1 pani puri ≈ 30 kcal · 1 slice of a LARGE pizza ≈ 250–300 kcal (so half a large pizza = 4–5 slices ≈ 1000–1400 kcal).
Restaurant/takeaway/creamy dishes run 20–40% higher than home versions — never scale them down to home portions; small street snacks stay small.
Count the FULL stated quantity ("half a pizza" = every slice in that half, "2 sandwiches" = 4 bread slices).
Protein is the most commonly OVERESTIMATED macro. Most vegetarian foods are protein-light: 1 bread slice ≈ 3g, 1 cheese slice ≈ 4g, potato ≈ 2g/100g, veg sabzi ≈ 3–5g/katori. Real protein only comes from dairy (paneer ≈ 18g/100g), dal/legumes (≈ 7–9g/katori cooked), soya (≈ 26g/100g chunks), whey (≈ 24g/scoop) — don't credit protein that isn't there.
Sanity-check every item before answering: protein×4 + carbs×4 + fat×9 must be within ~10% of its calories; if not, fix the macros, not the calories.

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
    return aiErrorResponse(error, "Failed to analyze food");
  }
}
