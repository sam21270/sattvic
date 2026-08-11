import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Message from an unknown thrown value. `catch (e)` is typed `unknown`, and
 *  narrowing it in every handler is noise. */
export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/**
 * Turn a meal suggestion into something worth searching the recipe list for.
 *
 * Suggestions read like "2 cups dal makhani" or "1 cup cooked chana masala +
 * 2 rotis". Searching that literally matches nothing, because recipe names do
 * not carry quantities — so the dish has to be pulled out of the phrase first.
 *
 * ponytail: strips the leading amount and takes the first dish of a combination.
 * Good enough to land someone on the right card; it is a search box, not a
 * parser, and a wrong guess still shows them the full list.
 */
export function dishQuery(suggestion: string): string {
  return suggestion
    .split(/\s+\+\s+|,/)[0]                              // "A + B" → first dish
    .replace(/^\s*[\d./]+\s*/, "")                       // leading "2", "1/2", "1.5"
    .replace(/^(cups?|cup|bowls?|katoris?|glass(es)?|tbsp|tsp|grams?|g|ml|pieces?|slices?|servings?)\s+/i, "")
    .replace(/^(of|cooked|raw|fresh|homemade)\s+/i, "")  // "cup COOKED chana masala"
    .trim();
}
