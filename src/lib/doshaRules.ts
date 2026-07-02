// Ayurvedic food guidelines for each dosha type.
// Vata (air/space)  — needs warm, grounding, oily, cooked foods
// Pitta (fire/water) — needs cooling, sweet, bitter, mild foods
// Kapha (earth/water) — needs light, dry, spicy, stimulating foods

export type Dosha = "vata" | "pitta" | "kapha";

// Tags in MEAL_POOL that indicate a meal is balancing for that dosha
export const DOSHA_GOOD_TAGS: Record<Dosha, string[]> = {
  vata:  ["Indian", "Comfort", "Warm", "Soup", "High Protein", "Make-Ahead", "Mediterranean"],
  pitta: ["Quick", "Low Carb", "Mediterranean", "Cooling", "Japanese"],
  kapha: ["Vegan", "Low Carb", "Spicy", "Quick", "Japanese", "Mexican"],
};

// Tags that are less ideal for that dosha (soft penalty, not hard exclude)
export const DOSHA_BAD_TAGS: Record<Dosha, string[]> = {
  vata:  ["Raw", "Cold", "Light"],
  pitta: ["Spicy", "Indian"],          // many Indian dishes are heating/spicy
  kapha: ["Comfort", "Make-Ahead"],    // often heavier dishes
};

// Partial meal name matches that are specifically balancing for each dosha
export const DOSHA_GOOD_NAMES: Record<Dosha, string[]> = {
  vata: [
    "Dal", "Khichdi", "Rajma", "Paneer", "Masala Oats", "Congee",
    "Ful Medames", "Shakshuka", "Soup", "Porridge", "Pudding",
  ],
  pitta: [
    "Cucumber", "Coconut", "Lentil Salad", "Greek", "Ratatouille",
    "Avocado", "Sushi", "Tofu", "Miso", "Gazpacho",
  ],
  kapha: [
    "Chana", "Besan", "Sprouts", "Roasted", "Stir Fry", "Edamame",
    "Sattu", "Chaas", "Makhana", "Pad Thai",
  ],
};

// Return a score adjustment for a meal given the user's dosha.
// Negative = bonus (lower score = better pick), Positive = penalty.
export function doshaScoreAdjustment(
  mealName: string,
  mealTags: string[],
  dosha: string | null
): number {
  if (!dosha) return 0;
  const d = dosha.toLowerCase() as Dosha;
  if (!DOSHA_GOOD_TAGS[d]) return 0;

  let adj = 0;
  if (mealTags.some((t) => DOSHA_GOOD_TAGS[d].includes(t))) adj -= 0.35;
  if (mealTags.some((t) => DOSHA_BAD_TAGS[d].includes(t)))  adj += 0.25;
  if (DOSHA_GOOD_NAMES[d].some((n) => mealName.toLowerCase().includes(n.toLowerCase()))) adj -= 0.5;
  return adj;
}

// Human-readable label shown as a badge on the meal row
export const DOSHA_BADGE: Record<Dosha, { label: string; color: string }> = {
  vata:  { label: "Vata ✦",  color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  pitta: { label: "Pitta ✦", color: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  kapha: { label: "Kapha ✦", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
};

export function isMealGoodForDosha(mealName: string, mealTags: string[], dosha: string | null): boolean {
  if (!dosha) return false;
  const d = dosha.toLowerCase() as Dosha;
  if (!DOSHA_GOOD_TAGS[d]) return false;
  return (
    mealTags.some((t) => DOSHA_GOOD_TAGS[d].includes(t)) ||
    DOSHA_GOOD_NAMES[d].some((n) => mealName.toLowerCase().includes(n.toLowerCase()))
  );
}
