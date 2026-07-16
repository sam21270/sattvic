import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    let { input } = await req.json();
    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Paste a recipe link or text" }, { status: 400 });
    }
    input = input.trim();

    // If it's a URL, fetch the page and strip it to readable text
    if (/^https?:\/\//i.test(input)) {
      const res = await fetch(input, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
      const html = await res.text();
      input = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 12000); // ponytail: char cap instead of readability lib
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Extract the recipe from this text. If there is no recipe, return {"error":"no recipe found"}.

TEXT: ${input.slice(0, 12000)}

Return ONLY valid JSON, no markdown:
{
  "name": "recipe name",
  "description": "one sentence",
  "calories": number (estimate per serving),
  "protein": number, "carbs": number, "fat": number, "fiber": number,
  "prepTime": number (minutes),
  "ingredients": ["amount + ingredient"],
  "instructions": ["step 1", "step 2"],
  "tags": ["Imported"],
  "isVegetarian": boolean
}`,
      }],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (json.error) return NextResponse.json({ error: json.error }, { status: 422 });
    return NextResponse.json(json);
  } catch (error) {
    console.error("Recipe import error:", error);
    return NextResponse.json({ error: "Couldn't read that — try pasting the recipe text directly" }, { status: 500 });
  }
}
