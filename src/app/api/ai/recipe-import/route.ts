import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/ai/groq";
import { aiErrorResponse } from "@/lib/ai/errors";
import { fetchPublicPage, htmlToText, pageDescription, pageImage } from "@/lib/safeFetch";
import { youtubeText, recipeLinkFrom, youtubeVideoId } from "@/lib/youtube";

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
    // Imported recipes used to be saved with image: "" and rendered as a blank
    // card. Both a video and a recipe blog always carry a picture.
    let image: string | null = null;

    // If it's a URL, fetch the page and strip it to readable text.
    // fetchPublicPage refuses private addresses and re-checks every redirect —
    // fetching this straight was server-side request forgery on an endpoint
    // anyone can call.
    if (/^https?:\/\//i.test(input)) {
      const url = input; // input gets replaced by page text below
      // YouTube first, when a key is configured — scraping the watch page comes
      // back empty from production because YouTube strips it for datacenter IPs.
      const yt = await youtubeText(url);
      if (yt) {
        pageHadDescription = yt.hasDescription;
        input = yt.text.slice(0, 12000);
        // Every video has a thumbnail, so a YouTube import always gets a picture.
        const id = youtubeVideoId(url);
        if (id) image = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        // Creators routinely write "RECIPE: <link>" and keep the ingredients on
        // their own site. Follow that one hop — the linked page is an ordinary
        // recipe blog, which imports cleanly — and lead with it, keeping the
        // description after it for context.
        const link = recipeLinkFrom(yt.text);
        if (link) {
          try {
            const html = await fetchPublicPage(link);
            const linked = htmlToText(html, 10000);
            if (linked) input = `${linked}\n\n${yt.text}`.slice(0, 12000);
            // The blog's own photo of the dish beats a video thumbnail.
            image = pageImage(html) ?? image;
          } catch {
            // Dead or unreachable link — the description alone still gets a try.
          }
        }
      } else {
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
        image = pageImage(html);
        input = htmlToText(html); // Note: char cap instead of readability lib
      }
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
    return NextResponse.json({ ...json, image });
  } catch (error) {
    console.error("Recipe import error:", error);
    return aiErrorResponse(error, "Couldn't read that — try pasting the recipe text directly");
  }
}
