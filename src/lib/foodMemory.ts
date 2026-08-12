/**
 * Macros the user has corrected, remembered by the phrase they were logged as.
 *
 * The estimates come from a model that does not know nutrition facts, so the
 * same food swings with the wording ("3 hashbrowns" vs "3 hash brown patties").
 * Patching the prompt per food does not scale; remembering the correction does.
 *
 * ponytail: exact phrase → exact numbers, no scaling by quantity. "2 rotis" and
 * "5 rotis" are separate entries. Scaling needs per-unit values and count
 * parsing out of free text — a new class of bugs — and people log the same
 * things the same way. Add scaling only if the entries actually pile up.
 *
 * The key starts with `sattvic`, so CloudSync already carries it across devices.
 */

const KEY = "sattvic-food-memory";

export interface RememberedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Drop everything that isn't a letter or digit, so spacing, hyphens and
 *  punctuation don't fork an entry: "hash-browns" = "hash browns" = "hashbrowns".
 *  Plurals still differ ("2 roti" ≠ "2 rotis") — stemming free text is guesswork. */
export function normalisePhrase(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * The key an item is remembered under.
 *
 * The model is asked to write the count into the item name and often doesn't —
 * "3 hash browns" came back named just "hash browns". Keyed on that alone, a
 * correction made for 3 would be reused for 5, which is the one thing this must
 * never do. So when the name carries no number, borrow one from the phrase the
 * user actually typed.
 *
 * ponytail: the comma segment at the item's own index. If the model merges two
 * segments into one item the borrowed count is the wrong one — but the key is
 * still a pure function of the same text, so the same meal keeps hitting the
 * same entry and a different quantity still lands on a different key.
 */
export function memoryKey(itemName: string, text: string, index: number): string {
  const name = normalisePhrase(itemName);
  if (/\d/.test(name)) return name;
  const qty = (text.split(",")[index] ?? "").match(/\d+(?:\.\d+)?/)?.[0] ?? "";
  return qty + name;
}

function load(): Record<string, RememberedMacros> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(all: Record<string, RememberedMacros>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* storage blocked or full — the meal still logs */ }
}

export function recallMacros(name: string): RememberedMacros | null {
  return load()[normalisePhrase(name)] ?? null;
}

export function rememberMacros(name: string, m: RememberedMacros) {
  const key = normalisePhrase(name);
  if (!key) return;
  save({
    ...load(),
    [key]: { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat },
  });
}

/** Undo: the saved numbers were wrong too, so stop reusing them. */
export function forgetMacros(name: string) {
  const all = load();
  delete all[normalisePhrase(name)];
  save(all);
}
