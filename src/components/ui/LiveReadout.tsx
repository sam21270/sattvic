"use client";

import { useEffect, useState } from "react";
import { calculateScore, currentStreak, dayKey, loadHistory, type ScoreTargets } from "@/lib/scoring";
import { loadTodayMeals } from "@/components/ui/AIFoodLog";

// Reuses the app's own scoring functions rather than recomputing — the landing
// must never disagree with the dashboard about your score.
const DEFAULT_TARGETS: ScoreTargets = { calories: 2000, protein: 120, carbs: 200, fat: 65, fiber: 30 };

export interface Readout {
  score: number;
  label: string;
  streak: number;
  protein: number;
  proteinTarget: number;
  meal: string | null;
  mealNote: string | null;
}

function read(): Readout | null {
  if (typeof window === "undefined") return null;
  const meals = loadTodayMeals();
  const history = loadHistory();
  // Nothing logged and no history — a brand-new visitor sees the sample card.
  if (meals.length === 0 && history.length === 0) return null;

  let targets = DEFAULT_TARGETS;
  try {
    const saved = JSON.parse(localStorage.getItem("sattvic-macro-targets") ?? "null");
    if (saved) targets = { ...targets, ...saved };
  } catch {}

  const totals = meals.reduce(
    (a, m) => ({
      calories: a.calories + (m.totals?.calories ?? 0),
      protein: a.protein + (m.totals?.protein ?? 0),
      carbs: a.carbs + (m.totals?.carbs ?? 0),
      fat: a.fat + (m.totals?.fat ?? 0),
      fiber: a.fiber + (m.totals?.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const dosha = (localStorage.getItem("sattvic-dosha") as "Vata" | "Pitta" | "Kapha" | null) ?? undefined;
  const bd = calculateScore(
    { date: dayKey(), ...totals, b12: 0, iron: 0, mealsLogged: meals.length, dosha },
    history,
    targets,
  );

  // The most recent thing actually eaten beats a planned meal — it's the number
  // the user can verify against their own day.
  const last = meals[meals.length - 1];
  // WeekPlan is keyed by day name; JS getDay() is Sunday-first, DAYS is Monday-first.
  const planned = (() => {
    try {
      const plan = JSON.parse(localStorage.getItem("sattvic-week-plan") ?? "null");
      if (!plan) return null;
      const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const today = plan[names[(new Date().getDay() + 6) % 7]];
      return today?.dinner?.name ?? null;
    } catch { return null; }
  })();

  return {
    score: bd.total,
    label: bd.label,
    streak: currentStreak(history),
    protein: Math.round(totals.protein),
    proteinTarget: targets.protein,
    meal: last?.text ?? planned ?? null,
    mealNote: last ? `logged ${last.time}` : planned ? "from your plan" : null,
  };
}

/** Renders live numbers once mounted; `fallback` covers SSR and new visitors. */
export function useReadout(): Readout | null {
  const [data, setData] = useState<Readout | null>(null);
  useEffect(() => {
    setData(read());
    // Re-read when another tab logs a meal, so the card can't go stale.
    const onStorage = () => setData(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return data;
}
