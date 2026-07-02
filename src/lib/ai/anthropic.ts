import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateMealSuggestions(preferences: {
  calories: number;
  protein: number;
  carbs: number;
  diet: string;
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Suggest 5 vegetarian meal ideas for someone with these daily targets:
- Calories: ${preferences.calories} kcal
- Protein: ${preferences.protein}g
- Carbs: ${preferences.carbs}g
- Diet style: ${preferences.diet}

Return a JSON array of meals with fields: name, description, calories, protein, carbs, fat, prepTime (minutes). No markdown, only valid JSON.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

export async function calculateMacros(input: {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Calculate daily macro targets for a vegetarian with these details:
- Weight: ${input.weight} kg
- Height: ${input.height} cm
- Age: ${input.age} years
- Gender: ${input.gender}
- Activity level: ${input.activityLevel}
- Goal: ${input.goal}

Return JSON with: calories, protein (g), carbs (g), fat (g), fiber (g), brief explanation. No markdown.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}
