import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";
import { fetchPublicPage, htmlToText, pageDescription } from "@/lib/safeFetch";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    let { input } = await req.json();
    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Paste a recipe link or text" }, { status: 400 });
    }
    input = input.trim();
    const fromVideo = /^https?:\/\/[^\s]*(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com)\//i.test(input);
    // Whether the page described itself at all. Without this the "the creator
    // wrote no description" message would also fire when the site served us a
    // stripped page, which would be us inventing a cause we never checked.
    let pageHadDescription = false;

    // If it's a URL, fetch the page and strip it to readable text.
    // fetchPublicPage refuses private addresses and re-checks every redirect —
    // fetching this straight was server-side request forgery on an endpoint
    // anyone can call.
    if (/^https?:\/\//i.test(input)) {
      let html: string;
      try {
        html = await fetchPublicPage(input);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "That link could not be imported." },
          { status: 400 },
        );
      }
      // Keeps the title, description metas and YouTube's shortDescription,
      // which plain tag-stripping discarded — that is where a video's recipe is.
      pageHadDescription = pageDescription(html).length > 0;
      input = htmlToText(html); // Note: char cap instead of readability lib
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
    if (json.error) {
      // A Short or Reel whose creator wrote no description carries the recipe
      // only in the video itself, so there is nothing on the page to read.
      // "no recipe found" made that look like the importer was broken.
      return NextResponse.json(
        {
          error:
            fromVideo && !pageHadDescription
              ? "That video has no written description — the recipe is only in the video itself. Paste the recipe text instead and it'll still work."
              : fromVideo
                ? "Couldn't find a recipe in that video's description. Paste the recipe text instead and it'll still work."
                : json.error,
        },
        { status: 422 },
      );
    }
    return NextResponse.json(json);
  } catch (error) {
    console.error("Recipe import error:", error);
    return aiErrorResponse(error, "Couldn't read that — try pasting the recipe text directly");
  }
}
