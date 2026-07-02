"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, CalendarDays } from "lucide-react";

interface LoggedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  portion: string;
}

interface DayRecord {
  date: string; // YYYY-MM-DD
  label: string; // "Monday 30 Jun"
  meals: Partial<Record<string, LoggedMeal | null>>;
  totals: { calories: number; protein: number; carbs: number; fat: number };
}

const SLOT_EMOJI: Record<string, string> = {
  breakfast: "🌅", snack1: "🍎", lunch: "☀️", snack2: "🥨", dinner: "🌙",
};
const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast", snack1: "Snack", lunch: "Lunch", snack2: "Snack", dinner: "Dinner",
};
const SLOTS = ["breakfast", "snack1", "lunch", "snack2", "dinner"];

function getPast7Days(): { date: string; label: string }[] {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
    days.push({ date, label });
  }
  return days;
}

export function WeekHistory() {
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const past = getPast7Days();
    const loaded: DayRecord[] = [];
    for (const { date, label } of past) {
      try {
        const meals = JSON.parse(localStorage.getItem(`sattvic-meals-${date}`) ?? "null");
        if (!meals) continue;
        const totals = Object.values(meals).reduce(
          (acc: { calories: number; protein: number; carbs: number; fat: number }, m: unknown) => {
            if (!m) return acc;
            const meal = m as LoggedMeal;
            return {
              calories: acc.calories + meal.calories,
              protein:  acc.protein  + meal.protein,
              carbs:    acc.carbs    + meal.carbs,
              fat:      acc.fat      + meal.fat,
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        loaded.push({ date, label, meals, totals });
      } catch {}
    }
    setRecords(loaded);
  }, []);

  function deleteDay(date: string) {
    localStorage.removeItem(`sattvic-meals-${date}`);
    setRecords((r) => r.filter((d) => d.date !== date));
  }

  if (records.length === 0) return null;

  return (
    <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-emerald-400" />
        <h2 className="font-bold text-zinc-100 text-lg">Past 7 Days</h2>
      </div>

      <div className="space-y-2">
        {records.map((day) => {
          const isOpen = open === day.date;
          const mealCount = Object.values(day.meals).filter(Boolean).length;
          return (
            <div key={day.date} className="rounded-2xl border border-white/[0.07] overflow-hidden">
              {/* collapsed row */}
              <button
                onClick={() => setOpen(isOpen ? null : day.date)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-200">{day.label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {mealCount} meal{mealCount !== 1 ? "s" : ""} logged · {day.totals.calories} kcal · {day.totals.protein}g protein
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    {[
                      { val: day.totals.calories, label: "kcal", color: "text-orange-400" },
                      { val: day.totals.protein,  label: "P",    color: "text-blue-400"   },
                    ].map((s) => (
                      <span key={s.label} className={`text-xs font-bold ${s.color}`}>
                        {s.val}{s.label}
                      </span>
                    ))}
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-zinc-500" />
                    : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
              </button>

              {/* expanded */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/[0.06] bg-[#0e0e0e]"
                  >
                    <div className="p-4 space-y-3">
                      {/* meal list */}
                      <div className="space-y-1.5">
                        {SLOTS.map((slot) => {
                          const meal = day.meals[slot];
                          if (!meal) return null;
                          return (
                            <div key={slot} className="flex items-center gap-3 py-1">
                              <span className="text-base w-6 text-center shrink-0">{SLOT_EMOJI[slot]}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-600 w-16 shrink-0">{SLOT_LABEL[slot]}</span>
                              <span className="flex-1 text-sm text-zinc-300 font-medium truncate">{meal.name}</span>
                              <span className="text-xs text-zinc-600 shrink-0">{meal.calories} kcal</span>
                              <span className="text-xs text-blue-400 shrink-0">{meal.protein}g P</span>
                              <span className="text-[11px] text-zinc-600 shrink-0 italic">{meal.portion}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* macro summary */}
                      <div className="flex gap-4 pt-2 border-t border-white/[0.06]">
                        {[
                          { label: "Calories", val: day.totals.calories, unit: "kcal", color: "text-orange-400" },
                          { label: "Protein",  val: day.totals.protein,  unit: "g",    color: "text-blue-400"   },
                          { label: "Carbs",    val: day.totals.carbs,    unit: "g",    color: "text-amber-400"  },
                          { label: "Fat",      val: day.totals.fat,      unit: "g",    color: "text-rose-400"   },
                        ].map((s) => (
                          <div key={s.label} className="text-center flex-1">
                            <p className={`text-sm font-bold ${s.color}`}>{s.val}{s.unit}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* delete button */}
                      <button
                        onClick={() => deleteDay(day.date)}
                        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-rose-400 transition-colors mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete this day's log
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
