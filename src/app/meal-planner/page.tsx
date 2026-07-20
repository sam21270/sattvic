"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles, ArrowRight, ShieldCheck, Clock, PlayCircle,
  ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Flame, Beef, Wheat, Droplets, ShoppingCart, Copy, Check, X, TrendingUp,
  Lock, Utensils
} from "lucide-react";
import { Meal, MacroTargets } from "@/types";
import { buildWeekPlan, swapSlot, regenerateDay, buildEmptyWeek, PLAN_SLOTS, PlanSlot, WeekPlan, LockedMeals } from "@/lib/mealPlan";
import { logMealToToday } from "@/components/ui/AIFoodLog";
import { planWeeklyKg, latestWeight, fmtKg } from "@/lib/weightProjection";
import { isMealGoodForDosha, DOSHA_BADGE, Dosha } from "@/lib/doshaRules";
import { FastType, FAST_META } from "@/lib/fastingRules";
import { CookMode } from "@/components/ui/CookMode";

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

// Words that describe preparation, not a thing to buy
const PREP_WORDS = new Set([
  "diced", "chopped", "sliced", "mashed", "pureed", "puréed", "grated", "minced",
  "cubed", "boiled", "cooked", "dried", "roasted", "soaked", "frozen", "fresh",
  "finely", "thinly", "roughly", "deseeded", "pitted", "peeled", "shredded",
  "to", "serve", "taste", "garnish", "optional", "and", "or", "&", "for", "of",
  "crumbled", "pinch", "square", "squares", "shavings", "slivered", "pods",
  "overnight", "splash", "drizzle", "handful", "bunch", "zest", "juice",
]);

// Not things you buy
const SKIP_ITEMS = new Set(["water", "ice", "warm water", "hot water", "ice cubes"]);

// Canonical buy-able items: first keyword match wins
const CANONICAL: [string, string][] = [
  ["cherry tomato", "Cherry tomatoes"], ["tomato", "Tomatoes"],
  ["spring onion", "Spring onions"], ["onion", "Onions"],
  ["baby spinach", "Spinach"], ["spinach", "Spinach"],
  ["ginger-garlic", "Garlic & ginger"], ["garlic", "Garlic & ginger"], ["ginger", "Garlic & ginger"],
  ["protein powder", "Protein powder"], ["whey", "Protein powder"],
  ["dark chocolate", "Dark chocolate"], ["cocoa", "Cocoa powder"],
  ["edamame", "Edamame"],
  ["sprout", "Moong for sprouting (start 2–3 days ahead)"],
  ["rajma", "Rajma (soak overnight before cooking)"], ["kidney bean", "Rajma (soak overnight before cooking)"],
  ["bell pepper", "Bell peppers"], ["capsicum", "Bell peppers"],
  ["banana", "Bananas"], ["lemon", "Lemons / limes"], ["lime", "Lemons / limes"],
  ["cucumber", "Cucumbers"], ["carrot", "Carrots"], ["peas", "Peas"],
  ["mushroom", "Mushrooms"], ["sweet corn", "Sweet corn"], ["corn", "Sweet corn"],
  ["coriander", "Fresh coriander"], ["mint", "Mint"], ["basil", "Fresh basil"],
  ["red chilli", "Dried red chillies"], ["chilli powder", "Chilli powder / flakes"],
  ["chilli flakes", "Chilli powder / flakes"], ["cayenne", "Chilli powder / flakes"],
  ["chilli", "Green chillies"],
  ["berries", "Mixed berries"], ["avocado", "Avocados"], ["mango", "Mangoes"],
  ["lettuce", "Lettuce"], ["cabbage", "Cabbage"], ["broccoli", "Broccoli"],
  ["potato", "Potatoes"], ["aubergine", "Aubergine"], ["eggplant", "Aubergine"],
  ["paneer", "Paneer"], ["tofu", "Tofu"], ["greek yogurt", "Greek yogurt"],
  ["yogurt", "Yogurt"], ["curd", "Yogurt"], ["milk", "Milk"], ["ghee", "Ghee"],
  ["butter", "Butter"], ["cheese", "Cheese"], ["cream", "Cream"], ["egg", "Eggs"],
  ["rice", "Rice"], ["roti", "Roti / atta"], ["oats", "Oats"], ["quinoa", "Quinoa"],
  ["besan", "Besan"], ["dal", "Dal / lentils"], ["lentil", "Dal / lentils"],
  ["bread", "Bread"], ["pasta", "Pasta"], ["noodle", "Noodles"],
  ["peanut", "Peanuts"], ["almond", "Almonds"], ["cashew", "Cashews"],
  ["chia", "Chia seeds"], ["flaxseed", "Flaxseeds"], ["honey", "Honey"],
  ["soy sauce", "Soy sauce"], ["olive oil", "Olive oil"], ["oil", "Cooking oil"],
  ["chickpea", "Chickpeas (soak overnight if dried)"], ["chana", "Chickpeas (soak overnight if dried)"],
  ["salt", "Salt"],
];

function canonicalItem(raw: string): string | null {
  const cleaned = raw
    .toLowerCase()
    .replace(/^.*?:/, "") // "dressing: 1 tbsp tahini" → "1 tbsp tahini"
    .replace(/\(.*?\)/g, "")
    .replace(/[\d½¼¾⅓⅔]+[\d\/.,\s]*(g|kg|ml|l|tbsp|tsp|cups?|handfuls?|slices?|pieces?|cloves?|cans?|scoops?|inch|cm)?\b/gi, "")
    .replace(/\b(medium|large|small|big|ripe|extra-firm|firm|thick|whole|full-fat|low-fat)\b/gi, "")
    .trim();
  if (!cleaned || cleaned.startsWith("scale all") || SKIP_ITEMS.has(cleaned)) return null;

  for (const [kw, label] of CANONICAL) {
    if (cleaned.includes(kw)) return label;
  }
  // no canonical match: drop prep words, keep what's left as its own item
  const words = cleaned.split(/\s+/).filter((w) => !PREP_WORDS.has(w));
  if (words.length === 0) return null;
  const name = words.join(" ").replace(/^[-–—.,\s]+|[-–—.,\s]+$/g, "").trim();
  return name.length > 2 ? name[0].toUpperCase() + name.slice(1) : null;
}

function buildGroceryList(plan: WeekPlan, servings: number): Record<string, string[]> {
  // canonical name → number of recipes that use it
  const counts = new Map<string, number>();

  for (const day of Object.values(plan)) {
    for (const meal of Object.values(day)) {
      if (!meal) continue;
      for (const ing of meal.ingredients ?? []) {
        // compound entries ("onion, tomato, cucumber, diced") → one item each
        for (const part of ing.split(",")) {
          const item = canonicalItem(part);
          if (item) counts.set(item, (counts.get(item) ?? 0) + 1);
        }
      }
    }
  }

  const grouped: Record<string, string[]> = {};
  for (const [item, n] of counts) {
    const cat = categoriseIngredient(item);
    if (!grouped[cat]) grouped[cat] = [];
    const forPeople = servings > 1 ? `, for ${servings} people` : "";
    grouped[cat].push(n > 1 ? `${item} (${n} recipes${forPeople})` : `${item}${forPeople ? ` (${forPeople.slice(2)})` : ""}`);
  }

  const ordered: Record<string, string[]> = {};
  for (const cat of GROCERY_CATEGORIES) {
    if (grouped[cat.label]) ordered[cat.label] = grouped[cat.label].sort();
  }
  if (grouped["🧃 Other"]) ordered["🧃 Other"] = grouped["🧃 Other"].sort();
  return ordered;
}

// ── Grocery list modal ────────────────────────────────────────────────────────

function GroceryModal({ plan, servings, onClose }: { plan: WeekPlan; servings: number; onClose: () => void }) {
  const list = buildGroceryList(plan, servings);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // pantry-aware: cross-reference against My Fridge contents
  const [fridge, setFridge] = useState<string[]>([]);
  useEffect(() => {
    try { setFridge(JSON.parse(localStorage.getItem("sattvic-fridge") ?? "[]")); } catch {}
  }, []);
  const inFridge = (item: string) =>
    fridge.some((f) => item.toLowerCase().includes(f.toLowerCase()));

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

  // Split into "actually buy this week" vs "pantry staples you likely have"
  const isPantryCat = (cat: string) => cat.includes("Spices") || cat.includes("Pantry");
  const [showPantry, setShowPantry] = useState(false);
  const shopEntries = Object.entries(list).filter(([cat]) => !isPantryCat(cat));
  const pantryEntries = Object.entries(list).filter(([cat]) => isPantryCat(cat));
  const pantryCount = pantryEntries.reduce((n, [, items]) => n + items.length, 0);
  const fridgeCount = shopEntries.reduce((n, [, items]) => n + items.filter(inFridge).length, 0);
  const toBuy = totalItems - pantryCount - fridgeCount;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm overflow-y-auto p-4" data-lenis-prevent onClick={onClose}>
      <div
        className="bg-[#141414] border border-white/[0.1] rounded-3xl max-w-4xl w-full mx-auto my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 bg-[#141414] border-b border-white/[0.08] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-3xl z-10">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 whitespace-nowrap">
              <ShoppingCart className="w-5 h-5 text-emerald-400 shrink-0" />
              Weekly Shopping List
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              <span className="text-emerald-400 font-bold">Only {toBuy} things to buy</span>
              {fridgeCount > 0 && ` · ${fridgeCount} already in your fridge`}
              {` · ${pantryCount} pantry top-ups`}
              {checked.size > 0 && ` · ${checked.size} ticked off`}
              {servings > 1 && <span className="text-emerald-400 ml-1">· for {servings} people</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "🛒 SATTVIC weekly shopping list\n\n" +
                Object.entries(list).map(([cat, items]) => `${cat}\n${items.map((i) => `• ${i}`).join("\n")}`).join("\n\n")
              )}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
            >
              Share
            </a>
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy all"}
            </button>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 ml-auto sm:ml-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* items — multi-column so the whole shop fits on one screen */}
        <div className="px-6 py-4">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
            {shopEntries.map(([category, items]) => (
              <div key={category} className="break-inside-avoid mb-5">
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
                        {inFridge(item) && !checked.has(item) && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
                            in fridge
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* pantry staples — collapsed by default so the list doesn't feel expensive */}
          <div className="border-t border-white/[0.07] pt-3 mt-2">
            <button
              onClick={() => setShowPantry((v) => !v)}
              className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
            >
              {showPantry ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Pantry staples ({pantryCount}) — you likely have these
            </button>
            {showPantry && (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 mt-3">
                {pantryEntries.map(([category, items]) => (
                  <div key={category} className="break-inside-avoid mb-5">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">{category}</p>
                    <ul className="space-y-1">
                      {items.map((item) => (
                        <li key={item}>
                          <button onClick={() => toggle(item)} className="flex items-center gap-3 w-full text-left py-1 group">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              checked.has(item) ? "bg-emerald-500 border-emerald-500" : "border-white/[0.2] group-hover:border-emerald-500/60"
                            }`}>
                              {checked.has(item) && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                            <span className={`text-sm ${checked.has(item) ? "text-zinc-600 line-through" : "text-zinc-400"}`}>{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
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
  servings = 1,
  locked = false,
  onToggleLock,
}: {
  slot: PlanSlot;
  meal: Meal | null;
  dosha: string | null;
  onSwap: () => void;
  swapping: boolean;
  servings?: number;
  locked?: boolean;
  onToggleLock?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [logged, setLogged] = useState(false);
  const fallback = FALLBACK_GRADIENTS[PLAN_SLOTS.indexOf(slot) % FALLBACK_GRADIENTS.length];
  const isGood = meal ? isMealGoodForDosha(meal.name, meal.tags, dosha) : false;
  const badge = dosha ? DOSHA_BADGE[dosha.toLowerCase() as Dosha] : null;

  useEffect(() => { setImgError(false); setOpen(false); setLogged(false); }, [meal?.name]);

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
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
          {meal.image && !imgError ? (
            <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: fallback }}>
              {SLOT_EMOJI[slot]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-xs uppercase tracking-wider font-bold text-zinc-500">
            {SLOT_EMOJI[slot]} {SLOT_LABELS[slot]}
            {meal.tags?.includes("Dessert") && (
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25 normal-case tracking-normal">
                🍰 Treat day
              </span>
            )}
            {locked && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 normal-case tracking-normal">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-100 text-base leading-tight line-clamp-1">{meal.name}</span>
            {isGood && badge && (
              <span className={`hidden sm:inline-flex shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs sm:text-sm">
            <span className="text-orange-400 font-semibold whitespace-nowrap">{meal.calories} kcal</span>
            <span className="text-blue-400 font-semibold whitespace-nowrap">{meal.protein}g protein</span>
            <span className="hidden sm:flex items-center gap-1 text-zinc-500 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />{meal.prepTime} min
            </span>
            <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold whitespace-nowrap">
              <PlayCircle className="w-3.5 h-3.5" />video
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>

      {/* expanded panel */}
      {open && (
        <div className="bg-white/[0.02] px-4 pb-5 pt-2 space-y-4">
          <div className="flex gap-4">
            {meal.image && !imgError && (
              <div className="w-44 h-32 rounded-xl overflow-hidden shrink-0 hidden sm:block">
                <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {isGood && badge && (
                <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>
                  {badge.label} — Balancing for your dosha
                </span>
              )}
              <p className="text-zinc-300 text-base leading-relaxed">{meal.description}</p>
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
                <a
                  href={meal.videoUrl ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(meal.name.replace(/\s*\(.*?x portion\)/, "") + " recipe vegetarian")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-colors">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {meal.videoUrl ? "Watch recipe video" : "Watch on YouTube"}
                </a>
                {meal.sourceUrl && (
                  <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />Full recipe
                  </a>
                )}
                {meal.instructions && meal.instructions.length > 0 && (
                  <button onClick={() => setCooking(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-500 transition-colors">
                    <Flame className="w-3.5 h-3.5" />Cook this
                  </button>
                )}
                <button
                  onClick={() => { logMealToToday(meal); setLogged(true); }}
                  disabled={logged}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    logged
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 cursor-default"
                      : "text-white bg-emerald-600 hover:bg-emerald-500"
                  }`}>
                  {logged ? <Check className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
                  {logged ? "Logged for today" : "I ate this"}
                </button>
                <button onClick={onSwap} disabled={swapping || locked}
                  title={locked ? "Unlock to swap this meal" : undefined}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${swapping ? "animate-spin" : ""}`} />
                  {swapping ? "Swapping…" : "Swap meal"}
                </button>
                {onToggleLock && (
                  <button onClick={onToggleLock}
                    title={locked ? "Unlock — regenerate may replace this" : "Lock — keep this meal when you regenerate"}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      locked
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20"
                        : "text-zinc-400 bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.08]"
                    }`}>
                    <Lock className="w-3.5 h-3.5" />
                    {locked ? "Locked" : "Lock"}
                  </button>
                )}
                {cooking && meal.instructions && (
                  <CookMode name={meal.name} steps={meal.instructions} onClose={() => setCooking(false)} />
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {meal.ingredients?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">
                  Ingredients{servings > 1 ? ` · scaled for ${servings} people` : ""}
                </p>
                <ul className="space-y-1.5">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0 mt-2" />
                      {servings > 1
                        ? ing.replace(/^([\d]+(?:[.,][\d]+)?)/, (m) => String(Math.round(parseFloat(m) * servings * 10) / 10))
                        : ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meal.instructions && meal.instructions.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">How to make it</p>
                <ol className="space-y-2">
                  {meal.instructions.map((step, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex gap-2.5 leading-relaxed">
                      <span className="text-emerald-500 font-bold shrink-0 w-5">{i + 1}.</span>
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
  const [jain, setJain] = useState(false);
  const [servings, setServings] = useState(1);
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [swappingSlot, setSwappingSlot] = useState<PlanSlot | null>(null);
  const [showGrocery, setShowGrocery] = useState(false);
  const [macrosStale, setMacrosStale] = useState(false); // macros >7 days old → nudge a re-check
  const [locks, setLocks] = useState<LockedMeals>({});
  const [loaded, setLoaded] = useState(false); // guards persistence until initial load runs
  const [regenDay, setRegenDay] = useState(false);
  const [maintenance, setMaintenance] = useState<number | null>(null);
  const [weightNow, setWeightNow] = useState<number | null>(null);

  const hasMeals = Object.values(plan).some((day) => Object.values(day).some((m) => m !== null));

  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem("sattvic-macro-targets") ?? "null");
      if (t) setTargets(t);
      if (t?.maintenance) setMaintenance(t.maintenance);
      setWeightNow(latestWeight());
      const a = JSON.parse(localStorage.getItem("sattvic-allergies") ?? "[]");
      setAllergies(a);
      const c = JSON.parse(localStorage.getItem("sattvic-conditions") ?? "[]");
      setConditions(c);
      const d = localStorage.getItem("sattvic-dosha");
      if (d) setDosha(d);
      setJain(localStorage.getItem("sattvic-jain") === "1");
      const macrosDate = localStorage.getItem("sattvic-macros-date");
      if (macrosDate) {
        const days = (Date.now() - new Date(macrosDate).getTime()) / 86400000;
        setMacrosStale(days >= 7);
      }
      // restore a previously generated week so it survives refresh
      const savedPlan = JSON.parse(localStorage.getItem("sattvic-week-plan") ?? "null");
      if (savedPlan) setPlan(savedPlan);
      const savedLocks = JSON.parse(localStorage.getItem("sattvic-week-locks") ?? "null");
      if (savedLocks) setLocks(savedLocks);
    } catch {}
    setLoaded(true);
  }, []);

  // persist the week + locks whenever they change (after the initial load)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("sattvic-week-plan", JSON.stringify(plan));
  }, [plan, loaded]);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("sattvic-week-locks", JSON.stringify(locks));
  }, [locks, loaded]);

  function toggleJain() {
    setJain((j) => {
      localStorage.setItem("sattvic-jain", j ? "0" : "1");
      return !j;
    });
  }

  function generatePlan() {
    setPlan(buildWeekPlan(DAYS, targets, allergies, conditions, dosha, fast, jain, locks));
  }

  // Reshuffle just the active day, keeping every other day (and any locks) intact
  function regenerateActiveDay() {
    setRegenDay(true);
    setPlan((p) => regenerateDay(p, activeDay, targets, allergies, conditions, dosha, fast, jain, locks));
    setRegenDay(false);
  }

  const isLocked = (day: string, slot: PlanSlot) => Boolean(locks[day]?.[slot]);

  // Lock keeps the current meal through regenerate; unlock removes the pin
  function toggleLock(day: string, slot: PlanSlot) {
    const name = plan[day]?.[slot]?.name;
    setLocks((prev) => {
      const daySlots = { ...(prev[day] ?? {}) };
      if (daySlots[slot]) delete daySlots[slot];
      else if (name) daySlots[slot] = name;
      return { ...prev, [day]: daySlots };
    });
  }

  // Drag a meal row onto a day tab to swap it with that day's same slot.
  // Locks follow the meal so a pinned dish stays pinned after it moves.
  function moveMeal(slot: PlanSlot, fromDay: string, toDay: string) {
    if (fromDay === toDay) return;
    setPlan((p) => ({
      ...p,
      [fromDay]: { ...p[fromDay], [slot]: p[toDay][slot] },
      [toDay]:   { ...p[toDay],   [slot]: p[fromDay][slot] },
    }));
    setLocks((prev) => {
      const from = { ...(prev[fromDay] ?? {}) };
      const to = { ...(prev[toDay] ?? {}) };
      const fromName = from[slot];
      const toName = to[slot];
      if (toName) from[slot] = toName; else delete from[slot];
      if (fromName) to[slot] = fromName; else delete to[slot];
      return { ...prev, [fromDay]: from, [toDay]: to };
    });
  }

  function handleSwap(slot: PlanSlot) {
    setSwappingSlot(slot);
    const newMeal = swapSlot(plan, activeDay, slot, targets, allergies, conditions, jain);
    if (newMeal) {
      setPlan((p) => ({ ...p, [activeDay]: { ...p[activeDay], [slot]: newMeal } }));
      // if this slot was locked, keep it locked to the newly chosen meal
      setLocks((prev) =>
        prev[activeDay]?.[slot]
          ? { ...prev, [activeDay]: { ...prev[activeDay], [slot]: newMeal.name } }
          : prev
      );
    }
    setSwappingSlot(null);
  }

  // Stats follow the selected day, not a weekly average
  const avg = Object.values(plan[activeDay] ?? {})
    .filter((m): m is Meal => m !== null)
    .reduce(
      (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const doshaLabel = dosha ? `${dosha.charAt(0).toUpperCase()}${dosha.slice(1)}` : null;
  const doshaBadge = dosha ? DOSHA_BADGE[dosha.toLowerCase() as Dosha] : null;
  const activeFast = FAST_META[fast];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* weekly check-in: macros are a week+ old, weight may have changed */}
      {macrosStale && (
        <div className="bg-amber-500/[0.08] border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-200/90">
            <span className="font-bold text-amber-300">It&apos;s been over a week.</span> Weigh in and update your macros so next week&apos;s plan stays accurate.
          </p>
          <Link href="/macros" className="flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 whitespace-nowrap">
            Update my macros <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

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
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/progress"
            className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] text-zinc-300 px-4 py-2.5 rounded-xl font-semibold hover:bg-white/[0.09] transition-colors text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Log meals
          </Link>
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

        {/* Jain mode — no root vegetables, fungi, eggs or honey */}
        <button
          onClick={toggleJain}
          title="No onion, garlic, potato, carrot or other root vegetables; no mushrooms, eggs or honey"
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
            jain
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
              : "bg-[#141414] text-zinc-400 border-white/[0.08] hover:border-white/[0.2]"
          }`}
        >
          🙏 Jain mode {jain ? "on" : "off"}
        </button>
        {jain && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-amber-500/10 text-amber-300/90 border-amber-500/25">
            No root veg · no fungi · no eggs · no honey
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

      {/* selected day's stats */}
      {hasMeals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Calories", emoji: "🔥", actual: avg.calories, target: targets.calories, unit: "kcal", tint: "from-orange-500/10" },
            { label: "Protein", emoji: "💪", actual: avg.protein, target: targets.protein, unit: "g", tint: "from-blue-500/10" },
            { label: "Carbs", emoji: "🌾", actual: avg.carbs, target: targets.carbs, unit: "g", tint: "from-amber-500/10" },
            { label: "Fat", emoji: "🥑", actual: avg.fat, target: targets.fat, unit: "g", tint: "from-rose-500/10" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.tint} to-[#141414] border border-white/[0.08] rounded-2xl p-4 space-y-1`}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{s.emoji} {s.label} · {activeDay.slice(0, 3)}</p>
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

      {/* projected weight if the plan is followed — plain 7700 kcal/kg math */}
      {hasMeals && maintenance && (() => {
        const kg = planWeeklyKg(
          DAYS.map((d) => Object.values(plan[d] ?? {}).reduce((s, m) => s + (m?.calories ?? 0), 0)),
          maintenance
        );
        if (kg === null) return null;
        return (
          <div className="bg-violet-500/[0.07] border border-violet-500/20 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
            <span className="text-2xl">⚖️</span>
            <p className="text-sm text-zinc-300 flex-1 min-w-[200px]">
              <span className="font-bold text-violet-300">Follow this plan → {fmtKg(kg)} this week</span>
              {weightNow !== null && (
                <span className="text-zinc-400"> · {weightNow} kg → <span className="font-bold text-white">{(weightNow + kg).toFixed(1)} kg</span></span>
              )}
              <span className="block text-xs text-zinc-500 mt-0.5">
                vs your {maintenance} kcal/day maintenance — deterministic math, not a promise
              </span>
            </p>
          </div>
        );
      })()}

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
            {DAYS.map((day, di) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const slot = e.dataTransfer.getData("slot") as PlanSlot;
                  if (slot) moveMeal(slot, activeDay, day);
                }}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-base font-bold transition-colors relative ${
                  activeDay === day
                    ? "bg-emerald-500 text-white"
                    : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.07]"
                }`}
              >
                {day.slice(0, 3)}
                {(di % 7 === 2 || di % 7 === 5) && (
                  <span className="absolute -top-1.5 -right-1.5 text-xs" title="Treat day — dessert included">🍰</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-zinc-300">{activeDay}</p>
            <button
              onClick={regenerateActiveDay}
              disabled={regenDay}
              title="Reshuffle only this day — other days and locked meals stay put"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenDay ? "animate-spin" : ""}`} />
              Reshuffle this day
            </button>
          </div>

          <DayProgress plan={plan} day={activeDay} targets={targets} />

          <motion.div
            key={activeDay}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="space-y-3"
          >
            {PLAN_SLOTS.map((slot) => (
              <motion.div
                key={slot}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
              >
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("slot", slot)}
                  title="Drag onto a day tab to move this meal"
                  className="bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-950/30 transition-all"
                >
                  <MealRow
                    slot={slot}
                    meal={plan[activeDay][slot]}
                    dosha={dosha}
                    onSwap={() => handleSwap(slot)}
                    servings={servings}
                    swapping={swappingSlot === slot}
                    locked={isLocked(activeDay, slot)}
                    onToggleLock={() => toggleLock(activeDay, slot)}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {hasMeals && (
        <Link
          href={inJourney ? "/dashboard?journey=1" : "/dashboard"}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-2xl font-semibold hover:bg-emerald-400 transition-colors"
        >
          {inJourney ? "Next: Go to your dashboard" : "Track today on your dashboard"} <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {showGrocery && <GroceryModal plan={plan} servings={servings} onClose={() => setShowGrocery(false)} />}
    </div>
  );
}
