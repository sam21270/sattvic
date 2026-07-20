"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Search, X, ChevronDown, PenLine, Trash2, Sparkles, Loader2 } from "lucide-react";
import { DayLog, dayKey } from "@/lib/scoring";
import { MEAL_POOL, PoolMeal } from "@/data/mealPool";
import { getMicros } from "@/lib/micronutrients";

interface AIMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  isAI: true;
}

interface MealLoggerProps {
  log: DayLog;
  onChange: (log: DayLog) => void;
}

const SLOTS = [
  { key: "breakfast", label: "Breakfast",     emoji: "🌅", mealType: "breakfast" },
  { key: "snack1",    label: "Morning Snack",  emoji: "🍎", mealType: "snack"     },
  { key: "lunch",     label: "Lunch",          emoji: "☀️", mealType: "main"      },
  { key: "snack2",    label: "Evening Snack",  emoji: "🥨", mealType: "snack"     },
  { key: "dinner",    label: "Dinner",         emoji: "🌙", mealType: "main"      },
] as const;

type SlotKey = (typeof SLOTS)[number]["key"];

interface LoggedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  b12: number;
  iron: number;
  portion: string;
}

// Standard serving options. For Indian meals we use katori/roti language.
const PORTION_OPTIONS = [
  { label: "½ serving",  multiplier: 0.5  },
  { label: "1 serving",  multiplier: 1    },
  { label: "1½ serving", multiplier: 1.5  },
  { label: "2 servings", multiplier: 2    },
];

// Extra Indian-unit options shown when the meal has Indian tags
const INDIAN_PORTION_OPTIONS = [
  { label: "1 katori",   multiplier: 0.75 },
  { label: "1 bowl",     multiplier: 1    },
  { label: "1½ bowls",   multiplier: 1.5  },
  { label: "2 rotis",    multiplier: 0.5  },
  { label: "3 rotis",    multiplier: 0.75 },
];

const INDIAN_TAGS = ["Indian"];


type Panel = "list" | "portion" | "custom";

function calcTotals(meals: Record<SlotKey, LoggedMeal | null>) {
  return Object.values(meals).reduce(
    (acc, m) => {
      if (!m) return acc;
      return {
        calories: acc.calories + m.calories,
        protein:  acc.protein  + m.protein,
        carbs:    acc.carbs    + m.carbs,
        fat:      acc.fat      + m.fat,
        fiber:    acc.fiber    + m.fiber,
        b12:      acc.b12      + m.b12,
        iron:     acc.iron     + m.iron,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, b12: 0, iron: 0 }
  );
}

function scaleMacros(m: PoolMeal, multiplier: number) {
  const r = (n: number) => Math.round(n * multiplier);
  return { calories: r(m.calories), protein: r(m.protein), carbs: r(m.carbs), fat: r(m.fat), fiber: r(m.fiber) };
}

export function MealLogger({ log, onChange }: MealLoggerProps) {
  const [open, setOpen]         = useState<SlotKey | null>(null);
  const [panel, setPanel]       = useState<Panel>("list");
  const [query, setQuery]       = useState("");
  const [pending, setPending]   = useState<PoolMeal | AIMeal | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState("");
  const [customResult, setCustomResult] = useState<{
    items: { name: string; calories: number; protein: number }[];
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    note?: string;
  } | null>(null);
  const [aiResults, setAiResults]   = useState<AIMeal[]>([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [meals, setMeals] = useState<Record<SlotKey, LoggedMeal | null>>({
    breakfast: null, snack1: null, lunch: null, snack2: null, dinner: null,
  });

  const loggedCount = Object.values(meals).filter(Boolean).length;
  const TODAY = dayKey();

  // Load persisted meals for today on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`sattvic-meals-${TODAY}`) ?? "null");
      if (saved) {
        setMeals(saved);
        const t = calcTotals(saved);
        onChange({ ...log, ...t, mealsLogged: Object.values(saved).filter(Boolean).length });
      }
    } catch {}
  }, []); // eslint-disable-line

  const libraryResults = useMemo(() => {
    if (!open || !query.trim()) return [];
    const q = query.toLowerCase();
    return MEAL_POOL.filter(
      (m) => m.name.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [query, open]);

  const suggestions = useMemo(() => {
    if (!open || query.trim()) return [];
    const slot = SLOTS.find((s) => s.key === open)!;
    return MEAL_POOL.filter((m) => m.mealType === slot.mealType).slice(0, 6);
  }, [open, query]);

  // Debounced AI lookup — fires when user stops typing and library has < 3 matches
  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      setAiResults([]);
      setAiLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAiLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/meal-nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mealName: query.trim() }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.calories) setAiResults([{ ...data, isAI: true as const }]);
        else setAiResults([]);
      } catch {
        setAiResults([]);
      } finally {
        setAiLoading(false);
      }
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function openPanel(slot: SlotKey) {
    setOpen(slot);
    setPanel("list");
    setQuery("");
    setPending(null);
    setShowCustom(false);
    setCustomText("");
    setCustomResult(null);
    setCustomError("");
  }

  function closePanel() {
    setOpen(null);
    setQuery("");
    setPending(null);
    setAiResults([]);
    setAiLoading(false);
    setShowCustom(false);
    setCustomText("");
    setCustomResult(null);
    setCustomError("");
  }

  function selectMeal(m: PoolMeal | AIMeal) {
    setPending(m);
    setPanel("portion");
  }

  function confirmPortion(slot: SlotKey, multiplier: number, portionLabel: string) {
    if (!pending) return;
    const r = (n: number) => Math.round(n * multiplier);
    const micros = getMicros(pending.name);
    commitMeal(slot, {
      name:     pending.name,
      calories: r(pending.calories),
      protein:  r(pending.protein),
      carbs:    r(pending.carbs),
      fat:      r(pending.fat),
      fiber:    r(pending.fiber),
      b12:      Math.round(micros.b12  * multiplier * 10) / 10,
      iron:     Math.round(micros.iron * multiplier * 10) / 10,
      portion:  portionLabel,
    });
  }

  function commitMeal(slot: SlotKey, meal: LoggedMeal) {
    const newMeals = { ...meals, [slot]: meal };
    setMeals(newMeals);
    localStorage.setItem(`sattvic-meals-${TODAY}`, JSON.stringify(newMeals));
    const t = calcTotals(newMeals);
    onChange({ ...log, ...t, mealsLogged: Object.values(newMeals).filter(Boolean).length });
    closePanel();
  }

  async function analyzeCustom() {
    if (!customText.trim() || customLoading) return;
    setCustomLoading(true);
    setCustomError("");
    setCustomResult(null);
    try {
      const res = await fetch("/api/ai/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: customText }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.items?.length) throw new Error();
      setCustomResult(data);
    } catch {
      setCustomError("Couldn't analyze that — try rephrasing (e.g. \"2 rotis, 1 katori dal\").");
    } finally {
      setCustomLoading(false);
    }
  }

  function submitCustom(slot: SlotKey) {
    if (!customResult) return;
    const micros = getMicros(customText);
    commitMeal(slot, {
      name:     customText.trim(),
      calories: customResult.totals.calories,
      protein:  customResult.totals.protein,
      carbs:    customResult.totals.carbs,
      fat:      customResult.totals.fat,
      fiber:    customResult.totals.fiber,
      b12:      micros.b12,
      iron:     micros.iron,
      portion:  "AI estimated",
    });
  }

  function removeMeal(slot: SlotKey) {
    const newMeals = { ...meals, [slot]: null };
    setMeals(newMeals);
    localStorage.setItem(`sattvic-meals-${TODAY}`, JSON.stringify(newMeals));
    const t = calcTotals(newMeals);
    onChange({ ...log, ...t, mealsLogged: Object.values(newMeals).filter(Boolean).length });
  }

  return (
    <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-zinc-100 text-lg">Log Today's Meals</h2>
        <span className="text-xs text-zinc-500 bg-white/[0.03] border border-white/[0.07] px-3 py-1 rounded-full">
          {loggedCount} / 5 logged
        </span>
      </div>

      <div className="space-y-2">
        {SLOTS.map(({ key, label, emoji }) => {
          const isOpen = open === key;
          const logged = meals[key];

          return (
            <div key={key} className="rounded-2xl overflow-hidden border border-white/[0.07]">
              {/* slot header */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  logged ? "bg-emerald-500/10" : isOpen ? "bg-white/[0.05]" : "bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
                onClick={() => (isOpen ? closePanel() : openPanel(key))}
              >
                <span className="text-lg shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
                  {logged ? (
                    <div>
                      <p className="text-sm font-semibold text-zinc-100 truncate">{logged.name}</p>
                      <p className="text-[11px] text-zinc-500">{logged.portion}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600">Tap to log</p>
                  )}
                </div>
                {logged ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-500 hidden sm:block">{logged.calories} kcal · {logged.protein}g P</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMeal(key); }}
                      className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : (
                  <Plus className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-45 text-zinc-400" : "text-zinc-600"}`} />
                )}
              </div>

              {/* expanded panel */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden border-t border-white/[0.06] bg-[#0e0e0e]"
                  >
                    {/* ── PANEL: list ── */}
                    {panel === "list" && (
                      <div className="p-3 space-y-3">
                        {/* search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search any meal from our library…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                          />
                          {query && (
                            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Suggestions (no query) */}
                        {!query && suggestions.length > 0 && (
                          <div className="space-y-0.5 max-h-48 overflow-y-auto">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-1 pb-1">Suggested for {label}</p>
                            {suggestions.map((m) => (
                              <button key={m.name} onClick={() => selectMeal(m)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left group">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{m.name}</p>
                                  <p className="text-[11px] text-zinc-500">{m.calories} kcal · {m.protein}g P · {m.carbs}g C</p>
                                </div>
                                <Plus className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 shrink-0 transition-colors" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Library results */}
                        {query && libraryResults.length > 0 && (
                          <div className="space-y-0.5 max-h-40 overflow-y-auto">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-1 pb-1">From our library</p>
                            {libraryResults.map((m) => (
                              <button key={m.name} onClick={() => selectMeal(m)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left group">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{m.name}</p>
                                  <p className="text-[11px] text-zinc-500">{m.calories} kcal · {m.protein}g P · {m.carbs}g C</p>
                                </div>
                                <Plus className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 shrink-0 transition-colors" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* AI lookup results */}
                        {query && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 px-1 pb-1">
                              <Sparkles className="w-3 h-3 text-violet-400" />
                              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">AI Nutrition Lookup</p>
                              {aiLoading && <Loader2 className="w-3 h-3 text-violet-400 animate-spin ml-auto" />}
                            </div>
                            {aiLoading && (
                              <p className="text-xs text-zinc-600 px-3 py-2">Looking up nutrition for "{query}"…</p>
                            )}
                            {!aiLoading && aiResults.map((m) => (
                              <button key={m.name} onClick={() => selectMeal(m)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-500/5 border border-violet-500/10 hover:border-violet-500/30 transition-colors text-left group">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{m.name}</p>
                                    <span className="shrink-0 text-[9px] font-bold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full">AI</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500">{m.calories} kcal · {m.protein}g P · {m.carbs}g C · {m.servingSize}</p>
                                </div>
                                <Plus className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 shrink-0 transition-colors" />
                              </button>
                            ))}
                            {!aiLoading && aiResults.length === 0 && query.length >= 3 && (
                              <p className="text-xs text-zinc-600 px-3 py-1">Could not find — try adding it manually below</p>
                            )}
                          </div>
                        )}

                        {/* custom meal */}
                        <div className="border-t border-white/[0.06] pt-2">
                          <button
                            onClick={() => setShowCustom((v) => !v)}
                            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            Just type what you ate — AI counts the macros
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCustom ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {showCustom && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3 space-y-2">
                                  <textarea
                                    placeholder='e.g. "2 rotis, 1 katori dal, half cup rice"'
                                    value={customText}
                                    rows={2}
                                    onChange={(e) => { setCustomText(e.target.value); setCustomResult(null); }}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyzeCustom(); } }}
                                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                                  />
                                  {customError && <p className="text-xs text-rose-400">{customError}</p>}

                                  {customResult && (
                                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 space-y-1.5">
                                      {customResult.items.map((it, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                          <span className="text-zinc-300">{it.name}</span>
                                          <span className="text-zinc-500 tabular-nums">{it.calories} kcal · {it.protein}g P</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-white/[0.07]">
                                        <span className="text-white">Total</span>
                                        <span className="text-emerald-400 tabular-nums">
                                          {customResult.totals.calories} kcal · {customResult.totals.protein}g P
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {!customResult ? (
                                    <button
                                      onClick={analyzeCustom}
                                      disabled={!customText.trim() || customLoading}
                                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                                    >
                                      {customLoading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Counting macros…</>
                                        : <><Sparkles className="w-4 h-4" /> Analyze with AI</>}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => submitCustom(key)}
                                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors"
                                    >
                                      Log this meal
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* ── PANEL: portion picker ── */}
                    {panel === "portion" && pending && (() => {
                      const isIndianMeal = "tags" in pending
                        ? pending.tags.some((t: string) => INDIAN_TAGS.includes(t))
                        : false;
                      const portionChoices = isIndianMeal
                        ? [...PORTION_OPTIONS, ...INDIAN_PORTION_OPTIONS]
                        : PORTION_OPTIONS;
                      return (
                      <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => { setPanel("list"); setPending(null); }}
                            className="text-zinc-500 hover:text-zinc-300 mt-0.5 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div>
                            <p className="text-sm font-bold text-zinc-100">{pending.name}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {pending.calories} kcal · {pending.protein}g protein
                              {"servingSize" in pending && pending.servingSize
                                ? ` · ${pending.servingSize}`
                                : " per serving"}
                            </p>
                            {"isAI" in pending && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full mt-1">
                                <Sparkles className="w-2.5 h-2.5" />AI estimated
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">How much did you have?</p>

                        <div className="grid grid-cols-2 gap-2">
                          {portionChoices.map(({ label: pLabel, multiplier }) => {
                            const r = (n: number) => Math.round(n * multiplier);
                            const scaled = { calories: r(pending.calories), protein: r(pending.protein) };
                            return (
                              <button
                                key={pLabel}
                                onClick={() => confirmPortion(key, multiplier, pLabel)}
                                className="flex flex-col items-start px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-left group"
                              >
                                <span className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300">{pLabel}</span>
                                <span className="text-[11px] text-zinc-500 mt-0.5">
                                  {scaled.calories} kcal · {scaled.protein}g P
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* custom grams / quantity */}
                        <CustomPortionRow
                          meal={pending}
                          onConfirm={(multiplier, label) => confirmPortion(key, multiplier, label)}
                        />
                      </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* totals strip */}
      {loggedCount > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
          <span className="text-zinc-500">Today's total</span>
          <div className="flex gap-3">
            <span className="text-orange-400 font-semibold">{log.calories} kcal</span>
            <span className="text-blue-400 font-semibold">{log.protein}g P</span>
            <span className="text-amber-400 font-semibold">{log.carbs}g C</span>
            <span className="text-rose-400 font-semibold">{log.fat}g F</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline custom grams/quantity input inside portion picker
function CustomPortionRow({
  meal,
  onConfirm,
}: {
  meal: PoolMeal | AIMeal;
  onConfirm: (multiplier: number, label: string) => void;
}) {
  const [grams, setGrams] = useState("");
  // We treat 1 serving as 100g equivalent for scaling purposes
  // The user can also enter a raw multiplier like "1.3"
  // If they enter a number < 10, treat as multiplier; otherwise treat as grams (base = 100g)
  const parsed   = parseFloat(grams);
  const isGrams  = parsed >= 10;
  const multiplier = grams ? (isGrams ? parsed / 100 : parsed) : null;
  const label     = grams ? (isGrams ? `${grams}g` : `${grams}x`) : "";

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <p className="text-[10px] text-zinc-600 mb-1">Or enter grams / custom multiplier</p>
        <input
          type="number"
          placeholder="e.g. 150g or 1.2x"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
        />
      </div>
      <button
        disabled={!multiplier || multiplier <= 0}
        onClick={() => multiplier && onConfirm(multiplier, label)}
        className="self-end px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Log
      </button>
    </div>
  );
}
