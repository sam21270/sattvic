"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Plus, Trash2, Check } from "lucide-react";
import { getMicros } from "@/lib/micronutrients";
import { dayKey } from "@/lib/scoring";

interface KeyIngredient {
  name: string;
  qty: number;
  unit: string;
  adjustable?: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  keyIngredients?: KeyIngredient[];
}

interface AnalyzedMeal {
  items: FoodItem[];
  totals: FoodItem & { name?: string };
  note: string;
}

export interface LoggedMeal {
  id: string;
  time: string; // HH:MM
  text: string;
  items: FoodItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
}

function todayKey() {
  return `sattvic-foodlog-${dayKey()}`;
}

export function loadTodayMeals(): LoggedMeal[] {
  try {
    return JSON.parse(localStorage.getItem(todayKey()) ?? "[]");
  } catch {
    return [];
  }
}

// Log a planned meal straight into today's food log (used by the meal planner's
// "I ate this" button). Writes the same shape the dashboard/progress read back.
export function logMealToToday(meal: {
  name: string; calories: number; protein: number; carbs: number; fat: number; fiber?: number;
}): LoggedMeal {
  const fiber = meal.fiber ?? 0;
  const entry: LoggedMeal = {
    id: Date.now().toString(36),
    time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }),
    text: meal.name,
    items: [{ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber }],
    totals: { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber },
  };
  const meals = loadTodayMeals();
  localStorage.setItem(todayKey(), JSON.stringify([...meals, entry]));
  return entry;
}

export interface FoodLogTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  b12: number;
  iron: number;
  mealsLogged: number;
}

function sumMeals(meals: LoggedMeal[]): FoodLogTotals {
  return meals.reduce(
    (acc, m) => {
      const micros = getMicros(m.text);
      return {
        calories: acc.calories + m.totals.calories,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat,
        fiber: acc.fiber + m.totals.fiber,
        b12: acc.b12 + micros.b12,
        iron: acc.iron + micros.iron,
        mealsLogged: acc.mealsLogged + 1,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, b12: 0, iron: 0, mealsLogged: 0 }
  );
}

// AI-powered food logger: type what you ate in plain language
// ("2 rotis, 1 cup rice, 1.5 cups paneer gravy") and AI estimates macros.
// No slots, no forms — any number of meals per day.
export function AIFoodLog({ onTotalsChange }: { onTotalsChange?: (totals: FoodLogTotals) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<AnalyzedMeal | null>(null);
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  // edited ingredient quantities, keyed "itemIdx:ingIdx"; and which editors are open
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [openEditor, setOpenEditor] = useState<number | null>(null);

  useEffect(() => {
    const loaded = loadTodayMeals();
    setMeals(loaded);
    if (loaded.length > 0) onTotalsChange?.(sumMeals(loaded));
  }, []); // eslint-disable-line

  function persist(next: LoggedMeal[]) {
    setMeals(next);
    localStorage.setItem(todayKey(), JSON.stringify(next));
    onTotalsChange?.(sumMeals(next));
  }

  // Recompute an item's macros from its ingredients scaled by any edited quantity.
  // Ingredients carry macros at their assumed qty, so factor = editedQty / assumedQty.
  function scaledItem(item: FoodItem, i: number): FoodItem {
    if (!item.keyIngredients?.length) return item;
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    item.keyIngredients.forEach((ing, j) => {
      const f = ing.qty ? (edits[`${i}:${j}`] ?? ing.qty) / ing.qty : 1;
      t.calories += ing.calories * f; t.protein += ing.protein * f;
      t.carbs += ing.carbs * f; t.fat += ing.fat * f; t.fiber += (ing.fiber ?? 0) * f;
    });
    return {
      ...item,
      calories: Math.round(t.calories), protein: Math.round(t.protein),
      carbs: Math.round(t.carbs), fat: Math.round(t.fat), fiber: Math.round(t.fiber),
    };
  }

  const scaledItems = pending?.items.map(scaledItem) ?? [];
  const liveTotals = scaledItems.reduce(
    (a, it) => ({ calories: a.calories + it.calories, protein: a.protein + it.protein, carbs: a.carbs + it.carbs, fat: a.fat + it.fat, fiber: a.fiber + it.fiber }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  async function analyze() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setPending(null);
    setEdits({});
    setOpenEditor(null);
    try {
      const res = await fetch("/api/ai/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("failed");
      const data: AnalyzedMeal = await res.json();
      if (!data.items?.length) throw new Error("failed");
      setPending(data);
    } catch {
      setError("Couldn't analyze that — try describing the food a bit differently.");
    } finally {
      setLoading(false);
    }
  }

  function confirmAdd() {
    if (!pending) return;
    const meal: LoggedMeal = {
      id: Date.now().toString(36),
      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }),
      text: text.trim(),
      items: scaledItems,   // includes any ingredient-quantity edits
      totals: liveTotals,
    };
    persist([...meals, meal]);
    setPending(null);
    setEdits({});
    setOpenEditor(null);
    setText("");
  }

  function removeMeal(id: string) {
    persist(meals.filter((m) => m.id !== id));
  }

  const dayTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totals.calories,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fat: acc.fat + m.totals.fat,
      fiber: acc.fiber + m.totals.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return (
    <div className="bg-white/[0.04] border border-emerald-500/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI Food Log</h2>
          <p className="text-xs text-zinc-500">Just type what you ate — AI counts the macros</p>
        </div>
      </div>

      {/* input */}
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              analyze();
            }
          }}
          placeholder='e.g. "2 rotis, 1 cup rice, 1.5 cups paneer gravy, 1 glass buttermilk"'
          rows={2}
          className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
        />
        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Counting macros…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Analyze with AI</>
          )}
        </button>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>

      {/* pending analysis — confirm before logging */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3"
          >
            <div className="space-y-2">
              {scaledItems.map((item, i) => {
                const adjustable = pending.items[i].keyIngredients?.some((g) => g.adjustable);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs tabular-nums">{item.calories} kcal · {item.protein}g P</span>
                        {adjustable && (
                          <button
                            onClick={() => setOpenEditor(openEditor === i ? null : i)}
                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                          >
                            {openEditor === i ? "Done" : "Adjust ▾"}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* editable key ingredients — assumed quantities pre-filled */}
                    {openEditor === i && pending.items[i].keyIngredients && (
                      <div className="mt-2 mb-1 pl-2 border-l-2 border-emerald-500/30 space-y-1.5">
                        <p className="text-[11px] text-zinc-500">Tweak what actually moves the calories — we&apos;ve assumed typical amounts.</p>
                        {pending.items[i].keyIngredients!.map((ing, j) =>
                          ing.adjustable === false ? null : (
                            <div key={j} className="flex items-center gap-2 text-xs">
                              <span className="flex-1 text-zinc-300 capitalize">{ing.name}</span>
                              <input
                                type="number" step="0.5" min="0"
                                value={edits[`${i}:${j}`] ?? ing.qty}
                                onChange={(e) => setEdits((p) => ({ ...p, [`${i}:${j}`]: Number(e.target.value) }))}
                                className="w-16 px-2 py-1 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white text-xs text-right focus:outline-none focus:border-emerald-500/50"
                              />
                              <span className="w-12 text-zinc-500">{ing.unit}</span>
                              <span className="w-16 text-right text-zinc-500 tabular-nums">
                                {Math.round(ing.calories * ((edits[`${i}:${j}`] ?? ing.qty) / (ing.qty || 1)))} kcal
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.07] text-sm">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {liveTotals.calories} kcal · {liveTotals.protein}g P · {liveTotals.carbs}g C · {liveTotals.fat}g F
              </span>
            </div>
            {pending.note && <p className="text-xs text-zinc-500 italic">{pending.note}</p>}
            <div className="flex gap-2">
              <button
                onClick={confirmAdd}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add to today
              </button>
              <button
                onClick={() => setPending(null)}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 rounded-lg text-sm transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* today's logged meals */}
      {meals.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Today&apos;s meals</h3>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">
              {dayTotals.calories} kcal · {dayTotals.protein}g protein
            </span>
          </div>
          {meals.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 group">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">{m.text}</p>
                <p className="text-[11px] text-zinc-600 tabular-nums">
                  {m.time} · {m.totals.calories} kcal · {m.totals.protein}g P · {m.totals.carbs}g C · {m.totals.fat}g F
                </p>
              </div>
              <button
                onClick={() => removeMeal(m.id)}
                aria-label={`Remove ${m.text}`}
                className="text-zinc-700 hover:text-rose-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
