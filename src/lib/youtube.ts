/**
 * Reading a YouTube video's description.
 *
 * Scraping the watch page does not work from production. YouTube serves a
 * stripped page to datacenter IPs: the same video whose description extracts to
 * 3,436 characters from a laptop — ingredients and all — comes back with an
 * empty description from Vercel. Same URL, same user-agent. No amount of parsing
 * gets past that, because the text is simply not in the response.
 *
 * The Data API returns the description reliably and is not IP-blocked. It needs
 * a key, so this stays optional: with YOUTUBE_API_KEY set, YouTube links go
 * through the API; without it, the importer falls back to fetching the page and
 * says honestly that it could not read the description.
 */

/** The 11-character id from any YouTube URL shape, or null if it isn't one. */
export function youtubeVideoId(url: string): string | null {
  const m =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:[&#]|$)/) ??
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)/) ??
    url.match(/youtube\.com\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)/);
  return m?.[1] ?? null;
}

export type YoutubeText = { text: string; hasDescription: boolean };

/**
 * The recipe link out of a video description.
 *
 * Creators very often write "RECIPE: https://their-blog.com/..." and keep the
 * ingredients on their own site rather than in the description — the rest of
 * the description being book, affiliate and social links. Reading only the
 * description then reports "no recipe" while the recipe sits one hop away on a
 * page this importer already handles well.
 *
 * The result is fetched through fetchPublicPage, which is what makes following
 * a third party's link safe: it refuses private addresses and re-checks every
 * redirect, so a description cannot point the server at internal network space.
 */
const NOT_A_RECIPE_SITE =
  /(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|facebook\.com|twitter\.com|x\.com|threads\.net|pinterest\.|snapchat\.com|reddit\.com|patreon\.com|spotify\.com|apple\.com|linktr\.ee|beacons\.ai|amazon\.|amzn\.|a\.co|bookshop\.org|barnesandnoble\.com|booksamillion\.com|target\.com|walmart\.com|shopmy\.us|ltk\.app|discord\.gg)/i;

export function recipeLinkFrom(description: string): string | null {
  const found = (description.match(/https?:\/\/[^\s)\]<>"]+/g) ?? [])
    // Trailing punctuation is part of the sentence, not the URL.
    .map((u) => u.replace(/[.,;:!?]+$/, ""))
    .filter((u) => !NOT_A_RECIPE_SITE.test(u));

  // A link the creator labelled as the recipe wins outright; otherwise take the
  // first ordinary link, which is nearly always their own site.
  return found.find((u) => /recipe/i.test(u)) ?? found[0] ?? null;
}

/**
 * Title + description for a video, or null when this isn't a YouTube URL, no key
 * is configured, or the API call fails — every one of which means "fall back to
 * the normal fetch" rather than "this video has nothing".
 */
export async function youtubeText(url: string): Promise<YoutubeText | null> {
  const key = process.env.YOUTUBE_API_KEY;
  const id = youtubeVideoId(url);
  if (!key || !id) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${key}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const snippet = (await res.json())?.items?.[0]?.snippet;
    if (!snippet) return null; // deleted, private, or a bad id

    const description = String(snippet.description ?? "").trim();
    const title = String(snippet.title ?? "").trim();
    if (!title && !description) return null;

    return {
      text: [title, description].filter(Boolean).join("\n\n"),
      // A creator who wrote no description is a real, different outcome from a
      // failed lookup, and the two deserve different messages.
      hasDescription: description.length > 0,
    };
  } catch {
    return null;
  }
}
