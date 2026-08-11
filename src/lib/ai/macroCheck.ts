/**
 * Calories are not an independent number — they are what the macros add up to,
 * by the Atwater factors every nutrition label uses. So an item claiming 140
 * kcal from 26g protein and no fat is not a judgement call, it is arithmetic
 * that does not work.
 *
 * The prompt already asks the model to check this. It does not reliably do it:
 * "2 egg whites" came back as 140 kcal / 26g protein, which implies 104 kcal
 * and is also roughly four times the real protein. Asking more firmly is not a
 * fix; checking the answer is.
 */

export type Macros = { calories: number; protein: number; carbs: number; fat: number };

/** 4 kcal per gram of protein and carbohydrate, 9 per gram of fat. */
export function impliedCalories(m: Pick<Macros, "protein" | "carbs" | "fat">): number {
  return Math.round(4 * (m.protein ?? 0) + 4 * (m.carbs ?? 0) + 9 * (m.fat ?? 0));
}

/**
 * Whether an item's stated calories match its macros.
 *
 * Compared against the larger of the two so a gap is caught whichever side is
 * wrong. 15% is loose on purpose: rounding to whole grams, fibre, and sugar
 * alcohols all move the number a little, and this should only fire on answers
 * that are actually impossible.
 */
export function isConsistent(m: Macros, tolerance = 0.15): boolean {
  const implied = impliedCalories(m);
  const stated = m.calories ?? 0;
  if (stated <= 0 && implied <= 0) return true;
  return Math.abs(implied - stated) <= tolerance * Math.max(stated, implied, 1);
}

/** Names of the items whose numbers do not add up, for feeding back to the model. */
export function inconsistentItems<T extends Macros & { name?: string }>(items: T[]): string[] {
  return items
    .filter((i) => !isConsistent(i))
    .map((i) => `"${i.name ?? "item"}" says ${i.calories} kcal but ${i.protein}g protein + ${i.carbs}g carbs + ${i.fat}g fat is ${impliedCalories(i)} kcal`);
}

/**
 * Last resort when the model will not produce a consistent answer: make the
 * calories match the macros it gave. Better to show a number that is at least
 * arithmetically possible than one that is visibly self-contradictory.
 */
export function reconcile<T extends Macros>(item: T): T {
  return isConsistent(item) ? item : { ...item, calories: impliedCalories(item) };
}
