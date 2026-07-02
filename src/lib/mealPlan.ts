import { MEAL_POOL, PoolMeal } from "@/data/mealPool";
import { Meal, MacroTargets } from "@/types";
import { doshaScoreAdjustment } from "@/lib/doshaRules";
import { filterFasting, FastType } from "@/lib/fastingRules";

export const PLAN_SLOTS = ["breakfast", "snack1", "lunch", "snack2", "dinner"] as const;
export type PlanSlot = (typeof PLAN_SLOTS)[number];

const SLOT_TO_TYPE: Record<PlanSlot, PoolMeal["mealType"]> = {
  breakfast: "breakfast",
  lunch: "main",
  dinner: "main",
  snack1: "snack",
  snack2: "snack",
};

const SLOT_SHARE: Record<PlanSlot, number> = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.3,
  snack1: 0.08,
  snack2: 0.07,
};

export type WeekPlan = Record<string, Record<PlanSlot, Meal | null>>;

export function buildEmptyWeek(days: string[]): WeekPlan {
  const plan: WeekPlan = {};
  for (const day of days) {
    plan[day] = { breakfast: null, lunch: null, dinner: null, snack1: null, snack2: null };
  }
  return plan;
}

function toMeal(p: PoolMeal, scale = 1): Meal {
  const round = (n: number) => Math.round(n * scale);
  return {
    name: scale > 1.05 ? `${p.name} (${scale.toFixed(1)}x portion)` : p.name,
    description: p.description,
    calories: round(p.calories),
    protein: round(p.protein),
    carbs: round(p.carbs),
    fat: round(p.fat),
    fiber: round(p.fiber),
    prepTime: p.prepTime,
    ingredients: scale > 1.05 ? [...p.ingredients, `Scale all quantities ×${scale.toFixed(1)} for this portion`] : p.ingredients,
    instructions: p.instructions,
    tags: p.tags,
    image: p.image,
    videoUrl: p.videoUrl,
    sourceUrl: p.sourceUrl,
    isHighProtein: p.protein / (p.calories / 100) >= 6,
    isLowCarb: p.carbs <= 30,
  };
}

function filterPool(allergies: string[], conditions: string[]): PoolMeal[] {
  const effectiveAllergies = conditions.includes("celiac")
    ? [...new Set([...allergies, "gluten"])]
    : allergies;

  const hardFiltered = MEAL_POOL.filter((m) => !m.allergens.some((a) => effectiveAllergies.includes(a)));
  const softFiltered = hardFiltered.filter((m) => !m.conditionFlags.some((c) => conditions.includes(c)));
  const types: PoolMeal["mealType"][] = ["breakfast", "main", "snack"];
  return types.some((t) => softFiltered.filter((m) => m.mealType === t).length === 0)
    ? hardFiltered
    : softFiltered;
}

// Primary ingredients that make a meal feel like "the same thing" if repeated
const BASE_KEYWORDS = [
  "greek yogurt", "yogurt", "curd",
  "tofu", "paneer", "cottage cheese",
  "chickpea", "chana",
  "lentil", "dal", "dhal",
  "rajma", "kidney bean",
  "egg", "egg white",
  "quinoa", "oats", "poha",
  "avocado", "banana", "mango",
  "soya", "soy chunk",
  "mushroom", "spinach", "aubergine", "eggplant",
  "black bean", "sweet potato",
];

function baseIngredients(meal: PoolMeal): string[] {
  const text = (meal.name + " " + meal.ingredients.join(" ")).toLowerCase();
  return BASE_KEYWORDS.filter((kw) => text.includes(kw));
}

// Scores a candidate — lower is better.
// Protein shortfalls are punished hardest; cross-day and same-day repeats are
// penalized but NOT added as hard exclusions here (caller filters those out first).
function scoreCandidate(
  c: PoolMeal,
  targetCal: number,
  targetProtein: number,
  usedBasesToday: Set<string>,
  dosha: string | null = null
): number {
  const calGap = (targetCal - c.calories) / targetCal;
  const calPenalty = calGap > 0 ? calGap * 1.1 : Math.abs(calGap) * 0.7;
  const proteinGap = (targetProtein - c.protein) / Math.max(targetProtein, 1);
  const proteinPenalty = proteinGap > 0 ? proteinGap * 2.2 : Math.abs(proteinGap) * 0.4;
  // Base-ingredient repeat within the same day — heavy penalty
  const bases = baseIngredients(c);
  const baseRepeatPenalty = bases.some((b) => usedBasesToday.has(b)) ? 5 : 0;
  const doshaPenalty = doshaScoreAdjustment(c.name, c.tags, dosha);
  return calPenalty + proteinPenalty + baseRepeatPenalty + doshaPenalty;
}

// Returns candidates filtered by hard cross-day diversity rules.
// A meal is hard-blocked if it appeared in the last 2 days.
// Falls back to a softer 1-day block if that wipes the pool, and to no block
// only as a last resort.
function freshCandidates(
  pool: PoolMeal[],
  type: PoolMeal["mealType"],
  usedToday: Set<string>,
  recentDays: Set<string>[],   // [yesterday, dayBefore]
): PoolMeal[] {
  const base = pool.filter((m) => m.mealType === type && !usedToday.has(m.name));

  // Try hard-blocking last 2 days
  const blockedFull = new Set([...recentDays[0] ?? [], ...recentDays[1] ?? []]);
  const fresh2 = base.filter((m) => !blockedFull.has(m.name));
  if (fresh2.length > 0) return fresh2;

  // Fall back: only block yesterday
  const fresh1 = base.filter((m) => !(recentDays[0] ?? new Set()).has(m.name));
  if (fresh1.length > 0) return fresh1;

  // Last resort: allow anything not used today
  return base.length > 0 ? base : pool.filter((m) => m.mealType === type);
}

function pickBest(
  candidates: PoolMeal[],
  targetCal: number,
  targetProtein: number,
  usedBasesToday: Set<string>,
  dosha: string | null = null
): PoolMeal {
  let best = candidates[0];
  let bestScore = Infinity;
  for (const c of candidates) {
    const score = scoreCandidate(c, targetCal, targetProtein, usedBasesToday, dosha);
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function dayTotals(day: Record<PlanSlot, PoolMeal | null>) {
  return PLAN_SLOTS.reduce(
    (acc, slot) => {
      const m = day[slot];
      if (!m) return acc;
      return { calories: acc.calories + m.calories, protein: acc.protein + m.protein };
    },
    { calories: 0, protein: 0 }
  );
}

// After the initial pick, try to boost protein by swapping low-density slots —
// but still respect the 2-day freshness rule.
function repairDayForProtein(
  day: Record<PlanSlot, PoolMeal | null>,
  pool: PoolMeal[],
  targets: MacroTargets,
  recentDays: Set<string>[]
) {
  const maxCalories = targets.calories * 1.15;
  const minCalories = targets.calories * 0.85;
  const blockedCrossDay = new Set([...recentDays[0] ?? [], ...recentDays[1] ?? []]);

  for (let pass = 0; pass < 6; pass++) {
    const totals = dayTotals(day);
    if (totals.protein >= targets.protein * 0.97) break;

    const slotsByProteinDensity = PLAN_SLOTS
      .filter((s) => day[s] !== null)
      .sort((a, b) => {
        const da = day[a]!.protein / day[a]!.calories;
        const db = day[b]!.protein / day[b]!.calories;
        return da - db;
      });

    let improved = false;
    for (const slot of slotsByProteinDensity) {
      const current = day[slot]!;
      const type = SLOT_TO_TYPE[slot];
      const usedNamesInDay = new Set(
        PLAN_SLOTS.map((s) => day[s]?.name).filter(Boolean) as string[]
      );

      const candidates = pool.filter((m) => {
        if (m.mealType !== type) return false;
        if (m.name === current.name || usedNamesInDay.has(m.name)) return false;
        if (blockedCrossDay.has(m.name)) return false;
        const newTotalCal = totals.calories - current.calories + m.calories;
        return newTotalCal <= maxCalories && newTotalCal >= minCalories;
      });
      if (candidates.length === 0) continue;

      const better = candidates.reduce((best, c) => (c.protein > best.protein ? c : best), candidates[0]);
      if (better.protein > current.protein) {
        day[slot] = better;
        improved = true;
        break;
      }
    }
    if (!improved) break;
  }
}

export function buildWeekPlan(
  days: string[],
  targets: MacroTargets,
  allergies: string[] = [],
  conditions: string[] = [],
  dosha: string | null = null,
  fast: FastType = "none"
): WeekPlan {
  const pool = filterFasting(filterPool(allergies, conditions), fast);
  const plan = buildEmptyWeek(days);

  // Track names used on each completed day for cross-day freshness checks
  const dayNameSets: Set<string>[] = []; // index 0 = first day, etc.

  for (let di = 0; di < days.length; di++) {
    const day = days[di];
    const usedToday = new Set<string>();
    const usedBasesToday = new Set<string>();

    // The two most recent completed days
    const recentDays: Set<string>[] = [
      dayNameSets[di - 1] ?? new Set(),
      dayNameSets[di - 2] ?? new Set(),
    ];

    const dayPool: Record<PlanSlot, PoolMeal | null> = {
      breakfast: null, lunch: null, dinner: null, snack1: null, snack2: null,
    };

    for (const slot of PLAN_SLOTS) {
      const type = SLOT_TO_TYPE[slot];
      const candidates = freshCandidates(pool, type, usedToday, recentDays);
      if (candidates.length === 0) continue;

      const chosen = pickBest(
        candidates,
        targets.calories * SLOT_SHARE[slot],
        targets.protein * SLOT_SHARE[slot],
        usedBasesToday,
        dosha
      );

      dayPool[slot] = chosen;
      usedToday.add(chosen.name);
      baseIngredients(chosen).forEach((b) => usedBasesToday.add(b));
    }

    repairDayForProtein(dayPool, pool, targets, recentDays);

    // Record what names were used today for future days' freshness check
    const todayNames = new Set(
      PLAN_SLOTS.map((s) => dayPool[s]?.name).filter(Boolean) as string[]
    );
    dayNameSets.push(todayNames);

    // Scale portions uniformly if calorie target can't be reached with this pool
    const totals = dayTotals(dayPool);
    const scale = totals.calories > 0
      ? Math.min(Math.max(targets.calories / totals.calories, 1), 1.8)
      : 1;

    for (const slot of PLAN_SLOTS) {
      const chosen = dayPool[slot];
      plan[day][slot] = chosen ? toMeal(chosen, scale) : null;
    }
  }

  return plan;
}

export function swapSlot(
  plan: WeekPlan,
  day: string,
  slot: PlanSlot,
  targets: MacroTargets,
  allergies: string[] = [],
  conditions: string[] = []
): Meal | null {
  const pool = filterPool(allergies, conditions);
  const type = SLOT_TO_TYPE[slot];
  const currentName = plan[day][slot]?.name;

  // Gather names used across the whole week to build freshness sets
  const days = Object.keys(plan);
  const di = days.indexOf(day);
  const makeSet = (d: string | undefined) =>
    d ? new Set(PLAN_SLOTS.map((s) => plan[d]?.[s]?.name).filter(Boolean) as string[]) : new Set<string>();
  const recentDays: Set<string>[] = [makeSet(days[di - 1]), makeSet(days[di - 2])];

  const usedToday = new Set(
    PLAN_SLOTS.map((s) => plan[day][s]?.name).filter(Boolean) as string[]
  );

  const poolByName = new Map(MEAL_POOL.map((m) => [m.name, m]));
  const usedBasesToday = new Set(
    PLAN_SLOTS.flatMap((s) => {
      const m = plan[day][s];
      if (!m || m.name === currentName) return [];
      const pm = poolByName.get(m.name);
      return pm ? baseIngredients(pm) : [];
    })
  );

  // Exclude current meal from usedToday so it's swappable
  if (currentName) usedToday.delete(currentName);

  const candidates = freshCandidates(pool, type, usedToday, recentDays);
  const filtered = candidates.filter((m) => m.name !== currentName);
  if (filtered.length === 0) return null;

  const chosen = pickBest(
    filtered,
    targets.calories * SLOT_SHARE[slot],
    targets.protein * SLOT_SHARE[slot],
    usedBasesToday
  );
  return toMeal(chosen);
}
