import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";
import { inconsistentItems, reconcile } from "@/lib/ai/macroCheck";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return NextResponse.json({ error: "Describe what you ate" }, { status: 400 });
    }

    // Pulled into a variable so the correction round below can replay it as the
    // first turn of the conversation rather than re-stating the rules.
    const prompt = `You are a clinical nutritionist with deep knowledge of Indian food portions (roti, dal, sabzi, paneer gravy, rice by the katori/cup) as well as global foods. A user describes what they ate in plain language. Estimate the nutrition of each item using standard portion sizes (1 roti ≈ 40g, 1 cup cooked rice ≈ 160g, 1 katori dal ≈ 150ml, etc.) and ICMR/USDA nutrient values.

Method — for EVERY item: resolve the stated quantity into countable units first (slices, pieces, cups — "half a LARGE pizza" = 4 slices; mixed dishes like khichdi use plates/bowls), WRITE that count into the item name (e.g. "half large veggie pizza (4 slices)"), then calories = count × per-unit value. Never guess a total directly.
Magnitude calibration (two ends of the scale): 1 pani puri ≈ 30 kcal · 1 slice of a LARGE pizza ≈ 250–300 kcal (so half a large pizza = 4–5 slices ≈ 1000–1400 kcal).
Restaurant/takeaway/creamy dishes run 20–40% higher than home versions — never scale them down to home portions; small street snacks stay small.
Count the FULL stated quantity ("half a pizza" = every slice in that half, "2 sandwiches" = 4 bread slices).
Protein is the most commonly OVERESTIMATED macro. Most vegetarian foods are protein-light: 1 bread slice ≈ 3g, 1 cheese slice ≈ 4g, potato ≈ 2g/100g, veg sabzi ≈ 3–5g/katori. Real protein only comes from dairy (paneer ≈ 18g/100g), dal/legumes (≈ 7–9g/katori cooked), soya (≈ 26g/100g chunks), whey (≈ 24g/scoop) — don't credit protein that isn't there.
Sanity-check every item before answering: protein×4 + carbs×4 + fat×9 must be within ~10% of its calories; if not, fix the macros, not the calories.
Removing a part of a food removes its nutrition — do not keep the whole food's numbers. "Egg white(s) only" / "no yolk": 1 large egg white ≈ 17 kcal, 3.6g protein, 0g fat (a WHOLE egg is ≈ 70 kcal, 6g protein, 5g fat), so 2 egg whites ≈ 34 kcal and 7g protein, NOT the 140 kcal of 2 whole eggs. The same applies to "malai/cream removed", "skin removed", "without oil".

HOME-COOKED COMPOSITE DISHES (dal khichdi, poha, sabzi, pasta, curries, fried rice — anything cooked from multiple ingredients where the recipe/quantities vary by kitchen): break the item into its main ingredients in "keyIngredients", each with the quantity you ASSUMED and its macros AT that quantity. Mark the ones whose amount really swings the calories and is uncertain — oil/ghee/butter, rice/grains, dal/legumes, paneer, sugar, nuts — as "adjustable": true (the user will fine-tune these). Aromatics/spices/vegetables can be one lumped line with "adjustable": false. The item's own calories/protein/carbs/fat MUST equal the sum of its keyIngredients so the numbers stay consistent when the user edits a quantity. For PACKAGED or single foods (a biscuit, a pear, Maggi, bread) omit keyIngredients entirely.

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
      "fiber": number,
      "keyIngredients": [
        { "name": "oil", "qty": 2, "unit": "tbsp", "adjustable": true, "calories": 240, "protein": 0, "carbs": 0, "fat": 27, "fiber": 0 }
      ]
    }
  ],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number },
  "note": "one short helpful sentence about this meal (protein quality, fiber, a gentle suggestion) — friendly, not preachy"
}

All top-level macro numbers are integers; keyIngredients qty may be decimal. Omit "keyIngredients" for packaged/single foods. If an item is ambiguous, assume the most common Indian home-cooked version. If something isn't food, skip it.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const parse = (c: typeof completion) => {
      const raw = c.choices[0]?.message?.content ?? "";
      return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    };

    let result = parse(completion);

    // The prompt asks the model to check its own arithmetic and it does not
    // reliably do so. Check it here, and if an item is impossible, hand the
    // model the specific contradiction and let it try once more — being told
    // "this says 140 kcal but the macros are 104" fixes it far more often than
    // asking more firmly up front. Only the bad case pays for the second call.
    const bad = inconsistentItems(result.items ?? []);
    if (bad.length) {
      const retry = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0,
        max_tokens: 1500,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: completion.choices[0]?.message?.content ?? "" },
          {
            role: "user",
            content: `These numbers do not add up:\n${bad.join("\n")}\n\nFor each, work out the real per-unit values again and correct the macros — a food with only protein cannot carry calories it has no fat or carbs for. Return the same JSON structure, corrected.`,
          },
        ],
      });
      try {
        const second = parse(retry);
        if (second?.items?.length) result = second;
      } catch { /* keep the first answer rather than fail the request */ }
    }

    // Whatever survives, never show arithmetic that is visibly impossible.
    if (Array.isArray(result.items)) {
      result.items = result.items.map(reconcile);
      const sum = (k: "calories" | "protein" | "carbs" | "fat" | "fiber") =>
        Math.round(result.items.reduce((s: number, i: Record<string, number>) => s + (i[k] ?? 0), 0));
      // Totals are shown next to the items, so they have to be the items' sum.
      result.totals = {
        calories: sum("calories"), protein: sum("protein"),
        carbs: sum("carbs"), fat: sum("fat"), fiber: sum("fiber"),
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Food log error:", error);
    return aiErrorResponse(error, "Failed to analyze food");
  }
}
