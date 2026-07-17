import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { answers, allergies = [], conditions = [] } = await req.json();

    const allergyNote = allergies.length
      ? `\n\nALLERGIES: ${allergies.join(", ")} — exclude all foods containing these.`
      : "";

    const conditionNote = conditions.length
      ? `\n\nHEALTH CONDITIONS: ${conditions.join(", ")} — tailor all food advice to be safe and beneficial for these conditions. For diabetes: low GI, low sugar foods. For thyroid: avoid goitrogens like raw cruciferous veg. For PCOS: anti-inflammatory, low GI. For high blood pressure: low sodium, high potassium. For IBS: low FODMAP. For high cholesterol: high fibre, low saturated fat.`
      : "";

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `You are an Ayurvedic nutrition expert and clinical dietitian. Based on these quiz answers, determine the person's dominant dosha and give personalised vegetarian nutrition advice that is completely safe given their health profile.

Quiz answers: ${JSON.stringify(answers)}${allergyNote}${conditionNote}

IMPORTANT: All food recommendations must:
1. Exclude any allergens listed above
2. Be appropriate and safe for any health conditions listed
3. Remain 100% vegetarian

Return ONLY valid JSON with this exact structure:
{
  "dosha": "Vata" | "Pitta" | "Kapha",
  "percentage": { "vata": number, "pitta": number, "kapha": number },
  "description": "2-sentence description of this dosha type",
  "qualities": ["quality1", "quality2", "quality3"],
  "nutritionPrinciples": ["principle1", "principle2", "principle3", "principle4"],
  "bestFoods": ["food1", "food2", "food3", "food4", "food5", "food6"],
  "avoidFoods": ["food1", "food2", "food3", "food4"],
  "mealTiming": "advice on when to eat",
  "color": "emerald" | "rose" | "amber",
  "conditionNotes": "1-2 sentence note about how these recommendations account for their health conditions and allergies, or empty string if none"
}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return NextResponse.json(JSON.parse(json));
  } catch (error) {
    console.error("Dosha error:", error);
    return aiErrorResponse(error, "Failed to calculate dosha");
  }
}
