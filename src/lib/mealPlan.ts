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

// Locked slots the planner must keep as-is on regenerate: day → slot → meal name.
export type LockedMeals = Record<string, Partial<Record<PlanSlot, string>>>;

const POOL_BY_NAME = new Map(MEAL_POOL.map((m) => [m.name, m]));

export function buildEmptyWeek(days: string[]): WeekPlan {
  const plan: WeekPlan = {};
  for (const day of days) {
    plan[day] = { breakfast: null, lunch: null, dinner: null, snack1: null, snack2: null };
  }
  return plan;
}

// Scale the leading quantity in an ingredient string to a real, tidy number
// (e.g. "200g paneer" ×1.3 → "260g paneer", "2 rotis" ×1.3 → "3 rotis").
// This replaces the old "(1.2x portion)" label with actual amounts.
function scaleIngredient(ing: string, scale: number): string {
  return ing.replace(/^(\d+(?:\.\d+)?)/, (m) => {
    const n = parseFloat(m) * scale;
    if (n >= 20) return String(Math.round(n / 5) * 5);   // grams/ml → nearest 5
    if (n >= 3)  return String(Math.round(n));            // medium counts → whole
    return String(Math.round(n * 2) / 2);                 // small counts → nearest 0.5
  });
}

function toMeal(p: PoolMeal, scale = 1): Meal {
  const round = (n: number) => Math.round(n * scale);
  const scaled = scale > 1.05;
  return {
    name: p.name,
    description: p.description,
    calories: round(p.calories),
    protein: round(p.protein),
    carbs: round(p.carbs),
    fat: round(p.fat),
    fiber: round(p.fiber),
    prepTime: p.prepTime,
    ingredients: scaled ? p.ingredients.map((i) => scaleIngredient(i, scale)) : p.ingredients,
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

function isDessert(meal: PoolMeal): boolean {
  return meal.tags.includes("Dessert");
}

// Jain diet: only meals manually audited as jain-safe (see PoolMeal.jain).
// Stricter than keyword matching — catches composite sauces (marinara, salsa,
// hummus) and sprouts, which keyword scans miss.
export function filterJain(pool: PoolMeal[]): PoolMeal[] {
  return pool.filter((m) => m.jain === true);
}

// Desserts are a treat, not a staple: only the evening snack slot on these
// day indices (0-based within the week) offers one. Wed + Sat pattern.
const DESSERT_DAY_INDICES = [2, 5];

// Scores a candidate — lower is better.
// Protein shortfalls are punished hardest; cross-day and same-day repeats are
// penalized but NOT added as hard exclusions here (caller filters those out first).
function scoreCandidate(
  c: PoolMeal,
  targetCal: number,
  targetProtein: number,
  usedBasesToday: Set<string>,
  dosha: string | null = null,
  weekUseCount: Map<string, number> | null = null,
  recentBases: Set<string> | null = null,
  baseWeekCount: Map<string, number> | null = null
): number {
  const calGap = (targetCal - c.calories) / targetCal;
  const calPenalty = calGap > 0 ? calGap * 1.1 : Math.abs(calGap) * 0.7;
  const proteinGap = (targetProtein - c.protein) / Math.max(targetProtein, 1);
  const proteinPenalty = proteinGap > 0 ? proteinGap * 2.2 : Math.abs(proteinGap) * 0.4;
  // Base-ingredient repeat within the same day — heavy penalty
  const bases = baseIngredients(c);
  const baseRepeatPenalty = bases.some((b) => usedBasesToday.has(b)) ? 5 : 0;
  // Same base on either of the last 2 days — softer, so paneer/tofu don't cluster
  const crossDayBasePenalty = recentBases && bases.some((b) => recentBases.has(b)) ? 2.5 : 0;
  // Same base used a lot across the week — spreads protein sources out
  const baseWeekPenalty = baseWeekCount
    ? bases.reduce((s, b) => s + (baseWeekCount.get(b) ?? 0), 0) * 0.6
    : 0;
  const doshaPenalty = doshaScoreAdjustment(c.name, c.tags, dosha);
  // Week-level variety: each prior appearance this week costs heavily, so the
  // plan explores the pool instead of settling into a repeating cycle.
  const weekRepeatPenalty = (weekUseCount?.get(c.name) ?? 0) * 3;
  return calPenalty + proteinPenalty + baseRepeatPenalty + crossDayBasePenalty + baseWeekPenalty + doshaPenalty + weekRepeatPenalty;
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
  dosha: string | null = null,
  weekUseCount: Map<string, number> | null = null,
  recentBases: Set<string> | null = null,
  baseWeekCount: Map<string, number> | null = null
): PoolMeal {
  // Rank by score, then pick at random among the few near-best candidates. The
  // scoring (macros, dosha, variety) still decides who's eligible — this only
  // breaks ties so "Regenerate" / "Reshuffle this day" produce a fresh plan each
  // press instead of the same deterministic pick every time.
  const scored = candidates
    .map((c) => ({ c, s: scoreCandidate(c, targetCal, targetProtein, usedBasesToday, dosha, weekUseCount, recentBases, baseWeekCount) }))
    .sort((a, b) => a.s - b.s);
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[Math.floor(Math.random() * top.length)].c;
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
  recentDays: Set<string>[],
  lockedSlots: Set<PlanSlot> = new Set()
) {
  const maxCalories = targets.calories * 1.15;
  const minCalories = targets.calories * 0.85;
  const blockedCrossDay = new Set([...recentDays[0] ?? [], ...recentDays[1] ?? []]);
  // Bases eaten on the last 2 days — the boost pass avoids repeating them so it
  // doesn't keep reaching for paneer (the highest-protein base) every day.
  const recentBases = new Set<string>();
  for (const name of blockedCrossDay) {
    const m = POOL_BY_NAME.get(name);
    if (m) baseIngredients(m).forEach((b) => recentBases.add(b));
  }

  for (let pass = 0; pass < 6; pass++) {
    const totals = dayTotals(day);
    // Being within ~12g of the protein target is good enough — chasing the last
    // few grams is what forced paneer into every slot. Variety over perfection.
    if (targets.protein - totals.protein <= 12) break;

    const slotsByProteinDensity = PLAN_SLOTS
      .filter((s) => day[s] !== null && !lockedSlots.has(s))
      .sort((a, b) => {
        const da = day[a]!.protein / day[a]!.calories;
        const db = day[b]!.protein / day[b]!.calories;
        return da - db;
      });

    let improved = false;
    for (const slot of slotsByProteinDensity) {
      const current = day[slot]!;
      if (isDessert(current)) continue; // the treat stays
      const type = SLOT_TO_TYPE[slot];
      const usedNamesInDay = new Set(
        PLAN_SLOTS.map((s) => day[s]?.name).filter(Boolean) as string[]
      );

      const candidates = pool.filter((m) => {
        if (m.mealType !== type) return false;
        if (isDessert(m)) return false;
        if (m.name === current.name || usedNamesInDay.has(m.name)) return false;
        if (blockedCrossDay.has(m.name)) return false;
        const newTotalCal = totals.calories - current.calories + m.calories;
        return newTotalCal <= maxCalories && newTotalCal >= minCalories;
      });
      if (candidates.length === 0) continue;

      // Prefer swaps that DON'T repeat a base already on the plate today or in the
      // last 2 days; only fall back to base-repeaters if variety leaves nothing.
      const usedBasesInDay = new Set(
        PLAN_SLOTS.filter((s) => s !== slot && day[s]).flatMap((s) => baseIngredients(day[s]!))
      );
      const avoid = new Set([...usedBasesInDay, ...recentBases]);
      const fresh = candidates.filter((m) => !baseIngredients(m).some((b) => avoid.has(b)));
      const pickFrom = fresh.length > 0 ? fresh : candidates;

      const better = pickFrom.reduce((best, c) => (c.protein > best.protein ? c : best), pickFrom[0]);
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
  fast: FastType = "none",
  jain = false,
  locked: LockedMeals = {}
): WeekPlan {
  let pool = filterFasting(filterPool(allergies, conditions), fast);
  if (jain) pool = filterJain(pool);
  const plan = buildEmptyWeek(days);

  // Track names used on each completed day for cross-day freshness checks
  const dayNameSets: Set<string>[] = []; // index 0 = first day, etc.
  const dayBaseSets: Set<string>[] = []; // bases used per day, for base-variety

  // Count of appearances across the whole week so far — drives variety
  const weekUseCount = new Map<string, number>();
  const baseWeekCount = new Map<string, number>(); // base → times used this week

  for (let di = 0; di < days.length; di++) {
    const day = days[di];
    const usedToday = new Set<string>();
    const usedBasesToday = new Set<string>();

    // The two most recent completed days
    const recentDays: Set<string>[] = [
      dayNameSets[di - 1] ?? new Set(),
      dayNameSets[di - 2] ?? new Set(),
    ];
    const recentBases = new Set<string>([
      ...(dayBaseSets[di - 1] ?? []),
      ...(dayBaseSets[di - 2] ?? []),
    ]);

    const dayPool: Record<PlanSlot, PoolMeal | null> = {
      breakfast: null, lunch: null, dinner: null, snack1: null, snack2: null,
    };
    const lockedSlots = new Set<PlanSlot>();

    for (const slot of PLAN_SLOTS) {
      // Locked slot: keep the exact meal the user pinned, but still register it
      // in the freshness/variety trackers so other days plan around it.
      const lockedName = locked[day]?.[slot];
      const lockedMeal = lockedName ? POOL_BY_NAME.get(lockedName) : undefined;
      if (lockedMeal) {
        dayPool[slot] = lockedMeal;
        lockedSlots.add(slot);
        usedToday.add(lockedMeal.name);
        baseIngredients(lockedMeal).forEach((b) => usedBasesToday.add(b));
        continue;
      }

      const type = SLOT_TO_TYPE[slot];
      let candidates = freshCandidates(pool, type, usedToday, recentDays);

      // Dessert treat: evening snack on dessert days picks from desserts;
      // every other slot never sees them.
      const wantDessert = slot === "snack2" && DESSERT_DAY_INDICES.includes(di % 7);
      const desserts = candidates.filter(isDessert);
      candidates = wantDessert && desserts.length > 0
        ? desserts
        : candidates.filter((m) => !isDessert(m));
      if (candidates.length === 0) continue;

      const chosen = pickBest(
        candidates,
        targets.calories * SLOT_SHARE[slot],
        targets.protein * SLOT_SHARE[slot],
        usedBasesToday,
        dosha,
        weekUseCount,
        recentBases,
        baseWeekCount
      );

      dayPool[slot] = chosen;
      usedToday.add(chosen.name);
      baseIngredients(chosen).forEach((b) => usedBasesToday.add(b));
    }

    repairDayForProtein(dayPool, pool, targets, recentDays, lockedSlots);

    // Record what names were used today for future days' freshness check
    const todayNames = new Set(
      PLAN_SLOTS.map((s) => dayPool[s]?.name).filter(Boolean) as string[]
    );
    dayNameSets.push(todayNames);
    todayNames.forEach((n) => weekUseCount.set(n, (weekUseCount.get(n) ?? 0) + 1));

    // record today's bases for cross-day + week base-variety
    const todayBases = new Set<string>(
      PLAN_SLOTS.flatMap((s) => (dayPool[s] ? baseIngredients(dayPool[s]!) : []))
    );
    dayBaseSets.push(todayBases);
    todayBases.forEach((b) => baseWeekCount.set(b, (baseWeekCount.get(b) ?? 0) + 1));

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
  conditions: string[] = [],
  jain = false
): Meal | null {
  let pool = filterPool(allergies, conditions);
  if (jain) pool = filterJain(pool);
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
  const currentPool = currentName ? poolByName.get(currentName) : undefined;
  const currentIsDessert = currentPool ? isDessert(currentPool) : false;
  let filtered = candidates.filter((m) => m.name !== currentName && isDessert(m) === currentIsDessert);
  if (filtered.length === 0) filtered = candidates.filter((m) => m.name !== currentName && !isDessert(m));
  if (filtered.length === 0) return null;

  const chosen = pickBest(
    filtered,
    targets.calories * SLOT_SHARE[slot],
    targets.protein * SLOT_SHARE[slot],
    usedBasesToday
  );
  return toMeal(chosen);
}

// Reshuffle a single day while leaving every other day untouched. Implemented by
// locking all other days (and any slots the user pinned on this day), then
// rebuilding — so the fresh day still respects week-wide variety and the locks.
export function regenerateDay(
  plan: WeekPlan,
  targetDay: string,
  targets: MacroTargets,
  allergies: string[] = [],
  conditions: string[] = [],
  dosha: string | null = null,
  fast: FastType = "none",
  jain = false,
  userLocked: LockedMeals = {}
): WeekPlan {
  const days = Object.keys(plan);
  const locked: LockedMeals = {};
  for (const d of days) {
    if (d === targetDay) {
      if (userLocked[d]) locked[d] = userLocked[d];
      continue;
    }
    const slots: Partial<Record<PlanSlot, string>> = {};
    for (const s of PLAN_SLOTS) {
      const name = plan[d]?.[s]?.name;
      if (name) slots[s] = name;
    }
    locked[d] = slots;
  }
  return buildWeekPlan(days, targets, allergies, conditions, dosha, fast, jain, locked);
}
