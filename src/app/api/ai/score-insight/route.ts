import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { score, breakdown, log } = await req.json();

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 120,
      messages: [
        {
          role: "user",
          content: `You are a concise Ayurvedic nutrition coach. Give ONE practical sentence of advice based on this person's day.

Sattvic Score: ${score}/100
Calories eaten: ${log.calories} (target 2000)
Protein eaten: ${log.protein}g (target 120g)
Meals logged: ${log.mealsLogged}/3
Dosha: ${log.dosha ?? "unknown"}
Weakest area: ${breakdown.protein < breakdown.calorie ? "protein" : "calories"}

Write exactly ONE sentence. Be specific, actionable, warm. No emojis. No "Great job". Just tell them what to do next.`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ insight: text });
  } catch {
    return NextResponse.json({ insight: "" });
  }
}
