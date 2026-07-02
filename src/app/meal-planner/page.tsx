"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles, ArrowRight, ShieldCheck, Clock, PlayCircle,
  ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Flame, Beef, Wheat, Droplets, ShoppingCart, Copy, Check, X
} from "lucide-react";
import { Meal, MacroTargets } from "@/types";
import { buildWeekPlan, swapSlot, buildEmptyWeek, PLAN_SLOTS, PlanSlot, WeekPlan } from "@/lib/mealPlan";
import { isMealGoodForDosha, DOSHA_BADGE, Dosha } from "@/lib/doshaRules";
import { FastType, FAST_META } from "@/lib/fastingRules";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SLOT_LABELS: Record<PlanSlot, string> = {
  breakfast: "Breakfast",
  snack1: "Morning Snack",
  lunch: "Lunch",
  snack2: "Evening Snack",
  dinner: "Dinner",
};
const SLOT_EMOJI: Record<PlanSlot, string> = {
  breakfast: "🌅",
  snack1: "🍎",
  lunch: "☀️",
  snack2: "🥨",
  dinner: "🌙",
};

const DEFAULT_TARGETS: MacroTargets = { calories: 2000, protein: 120, carbs: 200, fat: 65, fiber: 30 };

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg,#064e3b,#065f46)",
  "linear-gradient(135deg,#7c2d12,#9a3412)",
  "linear-gradient(135deg,#1e3a5f,#1d4ed8)",
  "linear-gradient(135deg,#3b0764,#6b21a8)",
  "linear-gradient(135deg,#713f12,#92400e)",
];

// ── Grocery list helpers ──────────────────────────────────────────────────────

const GROCERY_CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "🥬 Produce", keywords: ["onion", "tomato", "spinach", "cucumber", "pepper", "garlic", "ginger", "carrot", "mushroom", "potato", "broccoli", "zucchini", "eggplant", "leek", "celery", "avocado", "banana", "berry", "berries", "lemon", "lime", "orange", "apple", "mango", "coriander", "cilantro", "mint", "basil", "parsley", "chilli", "chili", "capsicum", "lettuce", "kale", "arugula", "fennel", "radish", "beetroot", "corn", "peas", "green bean", "spring onion", "scallion", "shallot", "pumpkin", "squash"] },
  { label: "🌾 Grains & Legumes", keywords: ["rice", "quinoa", "oats", "oat", "dal", "lentil", "chickpea", "chana", "rajma", "bean", "bread", "roti", "tortilla", "pasta", "noodle", "flour", "besan", "gram flour", "semolina", "barley", "millet", "bulgur", "couscous", "poha", "idli", "dosa"] },
  { label: "🥛 Dairy", keywords: ["yogurt", "curd", "paneer", "milk", "cheese", "butter", "ghee", "cream", "whey", "cottage cheese", "feta", "mozzarella"] },
  { label: "🥜 Nuts & Seeds", keywords: ["almond", "peanut", "cashew", "walnut", "chia", "sesame", "flaxseed", "sunflower seed", "pumpkin seed", "tahini", "nut butter", "pistachio", "pine nut", "makhana"] },
  { label: "🧂 Spices & Herbs", keywords: ["turmeric", "cumin", "coriander seed", "chilli powder", "paprika", "cinnamon", "cardamom", "bay leaf", "mustard seed", "curry leaf", "garam masala", "black pepper", "salt", "oregano", "thyme", "rosemary", "saffron", "asafoetida", "hing", "amchur", "chaat masala", "tamarind", "fenugreek"] },
  { label: "🫙 Pantry", keywords: ["oil", "olive oil", "coconut oil", "soy sauce", "honey", "maple syrup", "vinegar", "tomato puree", "tomato paste", "coconut milk", "vegetable stock", "broth", "sugar", "jaggery", "baking", "miso", "sriracha", "hot sauce", "ketchup", "mustard", "sauce"] },
  { label: "🧃 Other", keywords: [] },
];

function categoriseIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  for (const cat of GROCERY_CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat.label;
  }
  return "🧃 Other";
}

function buildGroceryList(plan: WeekPlan, servings: number): Record<string, string[]> {
  const seen = new Set<string>();
  const grouped: Record<string, string[]> = {};

  for (const day of Object.values(plan)) {
    for (const meal of Object.values(day)) {
      if (!meal) continue;
      for (const ing of meal.ingredients ?? []) {
        // normalise: strip leading quantities, lowercase, trim
        const normalised = ing
          .replace(/^\d[\d\/\s.,]*\s*(g|kg|ml|l|tbsp|tsp|cup|cups|handful|slice|slices|piece|pieces|clove|cloves|can|scoop|medium|large|small|inch|cm)?\s*/i, "")
          .trim()
          .toLowerCase();
        if (!normalised || seen.has(normalised) || normalised.startsWith("scale all")) continue;
        seen.add(normalised);
        const cat = categoriseIngredient(ing);
        if (!grouped[cat]) grouped[cat] = [];
        // Keep original capitalisation for display, just strip quantity prefix
        // Scale numeric prefix by servings
        const display = servings === 1
          ? ing.replace(/^\d[\d\/\s.,]*\s*(g|kg|ml|l|tbsp|tsp|cup|cups|handful|slice|slices|piece|pieces|clove|cloves|can|scoop|medium|large|small|inch|cm)?\s*/i, "").trim()
          : ing.replace(/^(\d[\d.,]*)/, (_, n) => String(Math.round(parseFloat(n) * servings * 10) / 10)).trim();
        grouped[cat].push(display);
      }
    }
  }

  // sort categories in defined order
  const ordered: Record<string, string[]> = {};
  for (const cat of GROCERY_CATEGORIES) {
    if (grouped[cat.label]) ordered[cat.label] = grouped[cat.label].sort();
  }
  return ordered;
}

// ── Grocery list modal ────────────────────────────────────────────────────────

function GroceryModal({ plan, servings, onClose }: { plan: WeekPlan; servings: number; onClose: () => void }) {
  const list = buildGroceryList(plan, servings);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  function toggle(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function copyAll() {
    const text = Object.entries(list)
      .map(([cat, items]) => `${cat}\n${items.map((i) => `• ${i}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalItems = Object.values(list).flat().length;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm overflow-y-auto p-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-white/[0.1] rounded-3xl max-w-lg w-full mx-auto my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 bg-[#141414] border-b border-white/[0.08] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              Weekly Shopping List
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {totalItems} ingredients · {checked.size} ticked off
              {servings > 1 && <span className="text-emerald-400 ml-1">· scaled for {servings} people</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy all"}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* items */}
        <div className="px-6 py-4 space-y-5">
          {Object.entries(list).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{category}</p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => toggle(item)}
                      className="flex items-center gap-3 w-full text-left py-1 group"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked.has(item)
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-white/[0.2] group-hover:border-emerald-500/60"
                      }`}>
                        {checked.has(item) && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className={`text-sm transition-colors ${checked.has(item) ? "text-zinc-600 line-through" : "text-zinc-300"}`}>
                        {item}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stat color ────────────────────────────────────────────────────────────────

function statColor(actual: number, target: number) {
  const pct = actual / target;
  if (pct >= 0.9 && pct <= 1.1) return "text-emerald-400";
  if (pct < 0.9) return "text-amber-400";
  return "text-rose-400";
}

export default function MealPlannerPage() {
  return (
    <Suspense fallback={null}>
      <MealPlanner />
    </Suspense>
  );
}

// ── Expandable meal row ───────────────────────────────────────────────────────

function MealRow({
  slot,
  meal,
  dosha,
  onSwap,
  swapping,
}: {
  slot: PlanSlot;
  meal: Meal | null;
  dosha: string | null;
  onSwap: () => void;
  swapping: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fallback = FALLBACK_GRADIENTS[PLAN_SLOTS.indexOf(slot) % FALLBACK_GRADIENTS.length];
  const isGood = meal ? isMealGoodForDosha(meal.name, meal.tags, dosha) : false;
  const badge = dosha ? DOSHA_BADGE[dosha.toLowerCase() as Dosha] : null;

  useEffect(() => { setImgError(false); setOpen(false); }, [meal?.name]);

  if (!meal) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-zinc-600 text-sm">
        <span className="text-lg opacity-40">{SLOT_EMOJI[slot]}</span>
        <span className="text-xs uppercase tracking-wide font-semibold w-28 shrink-0">{SLOT_LABELS[slot]}</span>
        <span className="italic text-xs">Not planned</span>
      </div>
    );
  }

  return (
    <div className="border-b border-white/[0.05] last:border-0">
      {/* collapsed row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.025] transition-colors text-left group"
      >
        <span className="text-xl shrink-0 w-7 text-center">{SLOT_EMOJI[slot]}</span>
        <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 w-28 shrink-0 hidden sm:block">
          {SLOT_LABELS[slot]}
        </span>
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          {meal.image && !imgError ? (
            <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: fallback }}>
              {SLOT_EMOJI[slot]}
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="font-semibold text-zinc-100 text-sm leading-tight line-clamp-1">{meal.name}</span>
          {isGood && badge && (
            <span className={`hidden sm:inline-flex shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs shrink-0">
          <span className="text-orange-400 font-semibold">{meal.calories} kcal</span>
          <span className="text-blue-400 font-semibold">{meal.protein}g P</span>
          <span className="flex items-center gap-1 text-zinc-600">
            <Clock className="w-3 h-3" />{meal.prepTime}m
          </span>
          {meal.videoUrl && <PlayCircle className="w-3.5 h-3.5 text-rose-400" />}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>

      {/* expanded panel */}
      {open && (
        <div className="bg-white/[0.02] px-4 pb-5 pt-2 space-y-4">
          <div className="flex gap-4">
            {meal.image && !imgError && (
              <div className="w-32 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {isGood && badge && (
                <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                  {badge.label} — Balancing for your dosha
                </span>
              )}
              <p className="text-zinc-400 text-sm leading-relaxed">{meal.description}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { Icon: Flame, val: `${meal.calories} kcal`, color: "text-orange-400 bg-orange-400/10" },
                  { Icon: Beef, val: `${meal.protein}g protein`, color: "text-blue-400 bg-blue-400/10" },
                  { Icon: Wheat, val: `${meal.carbs}g carbs`, color: "text-amber-400 bg-amber-400/10" },
                  { Icon: Droplets, val: `${meal.fat}g fat`, color: "text-rose-400 bg-rose-400/10" },
                ].map(({ Icon, val, color }) => (
                  <span key={val} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
                    <Icon className="w-3 h-3" />{val}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {meal.videoUrl && (
                  <a href={meal.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-colors">
                    <PlayCircle className="w-3.5 h-3.5" />Watch recipe video
                  </a>
                )}
                {meal.sourceUrl && (
                  <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />Full recipe
                  </a>
                )}
                <button onClick={onSwap} disabled={swapping}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${swapping ? "animate-spin" : ""}`} />
                  {swapping ? "Swapping…" : "Swap meal"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {meal.ingredients?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Ingredients</p>
                <ul className="space-y-1">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0 mt-1.5" />{ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meal.instructions && meal.instructions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">How to make it</p>
                <ol className="space-y-1.5">
                  {meal.instructions.map((step, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex gap-2">
                      <span className="text-emerald-500 font-bold shrink-0 w-4">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Day progress bars ─────────────────────────────────────────────────────────

function DayProgress({ plan, day, targets }: { plan: WeekPlan; day: string; targets: MacroTargets }) {
  const totals = PLAN_SLOTS.reduce(
    (acc, slot) => {
      const m = plan[day][slot];
      if (!m) return acc;
      return { calories: acc.calories + m.calories, protein: acc.protein + m.protein };
    },
    { calories: 0, protein: 0 }
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 text-xs px-1">
      {[
        { label: "calories", actual: totals.calories, target: targets.calories, unit: "kcal" },
        { label: "protein", actual: totals.protein, target: targets.protein, unit: "g" },
      ].map((s) => (
        <div key={s.label} className="flex items-center gap-2 flex-1">
          <span className="shrink-0 text-zinc-400 font-semibold w-32">
            {s.actual} / {s.target}{s.unit}
          </span>
          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statColor(s.actual, s.target).replace("text-", "bg-")}`}
              style={{ width: `${Math.min((s.actual / s.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function MealPlanner() {
  const searchParams = useSearchParams();
  const inJourney = searchParams.get("journey") === "1";
  const [plan, setPlan] = useState<WeekPlan>(buildEmptyWeek(DAYS));
  const [targets, setTargets] = useState<MacroTargets>(DEFAULT_TARGETS);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [dosha, setDosha] = useState<string | null>(null);
  const [fast, setFast] = useState<FastType>("none");
  const [servings, setServings] = useState(1);
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [swappingSlot, setSwappingSlot] = useState<PlanSlot | null>(null);
  const [showGrocery, setShowGrocery] = useState(false);

  const hasMeals = Object.values(plan).some((day) => Object.values(day).some((m) => m !== null));

  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem("sattvic-macro-targets") ?? "null");
      if (t) setTargets(t);
      const a = JSON.parse(localStorage.getItem("sattvic-allergies") ?? "[]");
      setAllergies(a);
      const c = JSON.parse(localStorage.getItem("sattvic-conditions") ?? "[]");
      setConditions(c);
      const d = localStorage.getItem("sattvic-dosha");
      if (d) setDosha(d);
    } catch {}
  }, []);

  function generatePlan() {
    setPlan(buildWeekPlan(DAYS, targets, allergies, conditions, dosha, fast));
  }

  function handleSwap(slot: PlanSlot) {
    setSwappingSlot(slot);
    const newMeal = swapSlot(plan, activeDay, slot, targets, allergies, conditions);
    if (newMeal) {
      setPlan((p) => ({ ...p, [activeDay]: { ...p[activeDay], [slot]: newMeal } }));
    }
    setSwappingSlot(null);
  }

  const allMeals = Object.values(plan).flatMap((day) => Object.values(day).filter((m): m is Meal => m !== null));
  const daysWithMeals = DAYS.filter((d) => Object.values(plan[d]).some((m) => m !== null)).length || 1;
  const totals = allMeals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const avg = {
    calories: Math.round(totals.calories / daysWithMeals),
    protein: Math.round(totals.protein / daysWithMeals),
    carbs: Math.round(totals.carbs / daysWithMeals),
    fat: Math.round(totals.fat / daysWithMeals),
  };

  const doshaLabel = dosha ? `${dosha.charAt(0).toUpperCase()}${dosha.slice(1)}` : null;
  const doshaBadge = dosha ? DOSHA_BADGE[dosha.toLowerCase() as Dosha] : null;
  const activeFast = FAST_META[fast];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Meal Planner</h1>
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <p className="text-zinc-500">
              Planning for{" "}
              <span className="text-emerald-400 font-semibold">{targets.calories} kcal · {targets.protein}g protein</span>
              {" "}—{" "}
              <Link href="/macros" className="underline hover:text-zinc-300">recalculate</Link>
            </p>
            {doshaLabel && doshaBadge && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${doshaBadge.color}`}>
                {doshaLabel} body type
              </span>
            )}
          </div>
          {(allergies.length > 0 || conditions.length > 0) && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-500/80 mt-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Filtered for {[...allergies, ...conditions].join(", ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasMeals && (
            <button
              onClick={() => setShowGrocery(true)}
              className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] text-zinc-300 px-4 py-2.5 rounded-xl font-semibold hover:bg-white/[0.09] transition-colors text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Shopping List
            </button>
          )}
          <button
            onClick={generatePlan}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {hasMeals ? "Regenerate" : "Generate Week"}
          </button>
        </div>
      </div>

      {/* fasting mode + family serving controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Fasting selector */}
        <div className="flex items-center gap-2 bg-[#141414] border border-white/[0.08] rounded-2xl px-4 py-2.5">
          <span className="text-base">{activeFast.icon}</span>
          <select
            value={fast}
            onChange={(e) => setFast(e.target.value as FastType)}
            className="bg-transparent text-sm font-semibold text-zinc-300 focus:outline-none cursor-pointer"
          >
            {(Object.keys(FAST_META) as FastType[]).map((k) => (
              <option key={k} value={k} className="bg-[#1a1a1a] text-zinc-100">
                {FAST_META[k].icon} {FAST_META[k].label}
              </option>
            ))}
          </select>
        </div>
        {fast !== "none" && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${activeFast.color}`}>
            {activeFast.description}
          </span>
        )}

        {/* Family serving scaler */}
        <div className="flex items-center gap-2 bg-[#141414] border border-white/[0.08] rounded-2xl px-4 py-2.5 ml-auto">
          <span className="text-sm text-zinc-500 font-semibold">👨‍👩‍👧 Cooking for</span>
          <button
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            className="w-6 h-6 rounded-full bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12] font-bold text-sm transition-colors flex items-center justify-center"
          >−</button>
          <span className="text-white font-bold w-4 text-center">{servings}</span>
          <button
            onClick={() => setServings((s) => Math.min(8, s + 1))}
            className="w-6 h-6 rounded-full bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12] font-bold text-sm transition-colors flex items-center justify-center"
          >+</button>
          <span className="text-sm text-zinc-500 font-semibold">{servings === 1 ? "person" : "people"}</span>
        </div>
      </div>

      {/* weekly avg stats */}
      {hasMeals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Calories", actual: avg.calories, target: targets.calories, unit: "kcal" },
            { label: "Protein", actual: avg.protein, target: targets.protein, unit: "g" },
            { label: "Carbs", actual: avg.carbs, target: targets.carbs, unit: "g" },
            { label: "Fat", actual: avg.fat, target: targets.fat, unit: "g" },
          ].map((s) => (
            <div key={s.label} className="bg-[#141414] border border-white/[0.08] rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{s.label} / day (avg)</p>
              <p className="text-2xl font-bold">
                <span className={statColor(s.actual, s.target)}>{s.actual}</span>
                <span className="text-zinc-600 text-sm font-medium"> / {s.target}{s.unit}</span>
              </p>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${statColor(s.actual, s.target).replace("text-", "bg-")}`}
                  style={{ width: `${Math.min((s.actual / s.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* empty state */}
      {!hasMeals && (
        <div className="text-center py-20 border border-dashed border-white/[0.1] rounded-3xl space-y-4">
          <p className="text-5xl">🍽️</p>
          <div>
            <p className="text-zinc-300 font-semibold text-lg">Your personalised week awaits</p>
            <p className="text-zinc-500 text-sm mt-1">
              {dosha
                ? `Meals optimised for your ${doshaLabel} dosha — matched to your macros.`
                : "Real recipes with photos, videos, ingredients & steps — matched to your macros."}
            </p>
          </div>
          <button
            onClick={generatePlan}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />Generate my week
          </button>
        </div>
      )}

      {/* day tabs + expandable meal rows */}
      {hasMeals && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeDay === day
                    ? "bg-emerald-500 text-white"
                    : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.07]"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          <DayProgress plan={plan} day={activeDay} targets={targets} />

          <div className="bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden">
            {PLAN_SLOTS.map((slot) => (
              <MealRow
                key={slot}
                slot={slot}
                meal={plan[activeDay][slot]}
                dosha={dosha}
                onSwap={() => handleSwap(slot)}
                swapping={swappingSlot === slot}
              />
            ))}
          </div>
        </div>
      )}

      {inJourney && hasMeals && (
        <Link
          href="/dashboard?journey=1"
          className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-2xl font-semibold hover:bg-emerald-400 transition-colors"
        >
          Next: Go to your dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {showGrocery && <GroceryModal plan={plan} servings={servings} onClose={() => setShowGrocery(false)} />}
    </div>
  );
}
