import { PoolMeal } from "@/data/mealPool";

export type FastType = "navratri" | "ekadashi" | "shravan" | "none";

export const FAST_META: Record<FastType, { label: string; icon: string; description: string; color: string }> = {
  none:      { label: "No fast",   icon: "🍽️", description: "Regular meal plan",                          color: "" },
  navratri:  { label: "Navratri",  icon: "🪔", description: "No grains, no legumes, dairy & fruits only", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  ekadashi:  { label: "Ekadashi",  icon: "🌕", description: "No grains, no beans — fruits & dairy ok",    color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  shravan:   { label: "Shravan",   icon: "🌿", description: "No onion/garlic — all else vegetarian ok",   color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

// Ingredient keywords that disqualify a meal for each fast type
// We check the ingredients list of every PoolMeal (case-insensitive)
const BLOCKED_INGREDIENTS: Record<FastType, string[]> = {
  none:     [],
  navratri: [
    "rice", "wheat", "oats", "semolina", "rava", "maida", "all-purpose flour",
    "dal", "lentil", "chickpea", "chana", "rajma", "bean", "peas",
    "pasta", "noodle", "bread", "roti", "tortilla", "poha", "quinoa",
    "soy sauce", "soy", "tofu", "tempeh", "barley", "corn",
  ],
  ekadashi: [
    "rice", "wheat", "oats", "semolina", "rava", "maida",
    "dal", "lentil", "chickpea", "chana", "rajma", "bean",
    "pasta", "noodle", "bread", "roti", "tortilla", "poha", "quinoa",
    "corn", "barley",
  ],
  shravan: ["onion", "garlic", "shallot"],
};

// Name/tag keywords that also block a meal
const BLOCKED_NAME_KEYWORDS: Record<FastType, string[]> = {
  none:     [],
  navratri: ["dal", "chana", "rajma", "pasta", "stir fry", "burrito", "sushi", "pad thai", "fried rice", "biryani", "khichdi"],
  ekadashi: ["dal", "chana", "rajma", "pasta", "stir fry", "burrito", "sushi", "pad thai", "fried rice", "biryani", "khichdi", "quinoa"],
  shravan:  [],
};

export function filterFasting(pool: PoolMeal[], fast: FastType): PoolMeal[] {
  if (fast === "none") return pool;

  const blockedIng  = BLOCKED_INGREDIENTS[fast].map((s) => s.toLowerCase());
  const blockedName = BLOCKED_NAME_KEYWORDS[fast].map((s) => s.toLowerCase());

  return pool.filter((meal) => {
    // check name
    const nameLower = meal.name.toLowerCase();
    if (blockedName.some((kw) => nameLower.includes(kw))) return false;

    // check ingredients
    const ingText = meal.ingredients.join(" ").toLowerCase();
    if (blockedIng.some((kw) => ingText.includes(kw))) return false;

    return true;
  });
}
