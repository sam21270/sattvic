import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

async function chat(prompt: string, maxTokens: number): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function generateMealSuggestions(preferences: {
  calories: number;
  protein: number;
  carbs: number;
  diet: string;
}) {
  const text = await chat(
    `Suggest 7 distinct vegetarian meal ideas for someone with these daily targets:
- Calories: ${preferences.calories} kcal
- Protein: ${preferences.protein}g
- Carbs: ${preferences.carbs}g
- Diet style: ${preferences.diet}

Each meal should roughly fit one-third of the daily targets (it's one meal out of three). Vary the meals — different cuisines, ingredients, and cooking styles, no repeats.

Return ONLY a valid JSON array of meals with this exact structure, no markdown:
[
  {
    "name": "meal name",
    "description": "one enticing sentence",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "prepTime": number (minutes),
    "ingredients": ["amount + ingredient", "..."],
    "instructions": ["step 1", "step 2", "step 3", "step 4"]
  }
]`,
    3000
  );
  return JSON.parse(text);
}

export async function generateSingleMeal(input: {
  calories: number;
  protein: number;
  carbs: number;
  diet: string;
  exclude: string[];
}) {
  const text = await chat(
    `Suggest ONE vegetarian meal idea for someone with these per-meal targets:
- Calories: ~${input.calories} kcal
- Protein: ~${input.protein}g
- Carbs: ~${input.carbs}g
- Diet style: ${input.diet}

Do NOT suggest any of these meals (already used): ${input.exclude.join(", ") || "none"}.

Return ONLY a valid JSON object, no markdown:
{
  "name": "meal name",
  "description": "one enticing sentence",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "prepTime": number (minutes),
  "ingredients": ["amount + ingredient", "..."],
  "instructions": ["step 1", "step 2", "step 3", "step 4"]
}`,
    700
  );
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

export function calculateMacros(input: {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
  pace?: "gentle" | "aggressive";
}) {
  // Mifflin-St Jeor BMR
  const bmr = input.gender.toLowerCase() === "female"
    ? 10 * input.weight + 6.25 * input.height - 5 * input.age - 161
    : 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;

  const activityMultipliers: Record<string, number> = {
    "sedentary":            1.2,
    "lightly active":       1.375,
    "moderately active":    1.55,
    "very active":          1.725,
    "extra active":         1.9,
  };
  const activityKey = Object.keys(activityMultipliers).find((k) =>
    input.activityLevel.toLowerCase().includes(k)
  ) ?? "moderately active";
  const tdee = Math.round(bmr * activityMultipliers[activityKey]);

  const goalKey = input.goal.toLowerCase();

  // Weight loss: percentage deficit, never below a safe intake floor
  // (1200 F / 1500 M). Gentle = 18% long-run, Aggressive = 25%.
  const floor = input.gender.toLowerCase() === "female" ? 1200 : 1500;
  const finalPct = input.pace === "aggressive" ? 0.25 : 0.18;
  const calAt = (pct: number) => Math.max(Math.round(tdee * (1 - pct)), floor);
  const calories =
    goalKey.includes("lose")   ? calAt(finalPct) :
    goalKey.includes("gain")   ? Math.round(tdee + 300) :
    tdee;

  // Taper plan: ease in over weeks instead of dropping to the target on day 1
  const phases = goalKey.includes("lose")
    ? [
        { label: "Weeks 1–2", calories: calAt(0.08), note: "Ease in — just below maintenance, build the habit" },
        { label: "Weeks 3–4", calories: calAt(finalPct / 2 + 0.04), note: "Step down — appetite has adjusted" },
        { label: "Week 5+",  calories: calAt(finalPct), note: "Full pace — your long-run target" },
      ]
    : undefined;

  // Protein: 1.6 g/kg for gain/maintain, 1.4 g/kg for loss (preserve muscle)
  const proteinPerKg = goalKey.includes("gain") ? 1.6 : 1.4;
  const protein = Math.round(input.weight * proteinPerKg);

  // Fat: 25% of calories
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remainder
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  // Fiber: 14g per 1000 kcal (ICMR guideline)
  const fiber = Math.round((calories / 1000) * 14);

  const goalDescriptions: Record<string, string> = {
    lose: `To lose weight, you're in a gentle ${tdee - calories} kcal daily deficit from your maintenance of ${tdee} kcal — about ${Math.round(((tdee - calories) / tdee) * 100)}%, which is sustainable and won't leave you starving in week one. Expect roughly ${(((tdee - calories) * 7) / 7700).toFixed(1)} kg lost per week. Protein is set at ${proteinPerKg}g/kg to preserve muscle while in a deficit.`,
    gain: `To gain muscle, you're in a 300 kcal surplus over your maintenance of ${tdee} kcal. Protein is set at ${proteinPerKg}g/kg to support muscle synthesis.`,
    maintain: `To maintain weight, calories match your TDEE of ${tdee} kcal. Protein at ${proteinPerKg}g/kg supports muscle health on a vegetarian diet.`,
  };
  const descKey = goalKey.includes("lose") ? "lose" : goalKey.includes("gain") ? "gain" : "maintain";
  const explanation = `${goalDescriptions[descKey]} Carbohydrates (${carbs}g) provide the bulk of energy from whole grains, fruits, and vegetables. Fat (${fat}g) comes from nuts, seeds, and healthy oils. Fiber target of ${fiber}g supports gut health.`;

  return { calories, protein, carbs, fat, fiber, explanation, phases, maintenance: tdee };
}

export { chat };
