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
 * The keys a meal's items are remembered under — one per item, in order.
 *
 * Keyed on what the USER typed, not on what the model called it. The model's
 * name for the same food drifts between calls: "3 hash browns" came back as
 * "hash browns" one run and "3 hash browns" the next, and the same tea was
 * named "…6% milk no sugar" once and "…6% milk no sugar (1 cup)" the next.
 * Keyed on that, a saved correction goes missing at random. What the user
 * types is stable, and it is also the thing they control — writing "with 1%
 * milk" is how they tell two versions of the same drink apart.
 *
 * ponytail: the comma segment at the item's own index. The model usually
 * returns one item per segment. When it splits one segment into several, the
 * extra items fall back to their name and a repeat of the same key is
 * disambiguated by name, so two foods can never overwrite each other's entry.
 */
export function memoryKeys(items: { name: string }[], text: string): string[] {
  const segments = text.split(",");
  const used = new Set<string>();
  return items.map((item, i) => {
    let key = normalisePhrase(segments[i] ?? "") || normalisePhrase(item.name);
    if (used.has(key)) key += normalisePhrase(item.name);
    used.add(key);
    return key;
  });
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
