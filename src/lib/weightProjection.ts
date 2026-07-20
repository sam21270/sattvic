// Deterministic weight math: 7700 kcal ≈ 1 kg of body weight.
// ponytail: workouts are NOT subtracted — maintenance (TDEE) already includes
// the user's activity level, subtracting logged workouts would double-count.
const KCAL_PER_KG = 7700;

import { dayKey } from "./scoring";

export function maintenanceFromStorage(): number | null {
  try {
    return JSON.parse(localStorage.getItem("sattvic-macro-targets") ?? "null")?.maintenance ?? null;
  } catch { return null; }
}

export function latestWeight(): number | null {
  try {
    const entries: { date: string; weight?: number }[] =
      JSON.parse(localStorage.getItem("sattvic-progress") ?? "[]");
    const w = entries.filter((e) => e.weight).sort((a, b) => a.date.localeCompare(b.date));
    return w.length ? w[w.length - 1].weight! : null;
  } catch { return null; }
}

// Predicted change from what was actually logged over the last 7 days.
export function weekPrediction(maintenance: number): { days: number; avgIntake: number; kg: number } | null {
  let days = 0, intake = 0;
  for (let i = 0; i < 7; i++) {
    try {
      const meals: { totals?: { calories?: number } }[] =
        JSON.parse(localStorage.getItem(`sattvic-foodlog-${dayKey(i)}`) ?? "[]");
      if (meals.length) {
        days++;
        intake += meals.reduce((s, m) => s + (m.totals?.calories ?? 0), 0);
      }
    } catch {}
  }
  if (!days) return null;
  return { days, avgIntake: Math.round(intake / days), kg: (intake - maintenance * days) / KCAL_PER_KG };
}

// Actual scale change across the last 8 days — needs two weigh-ins to compare.
export function actualWeekChange(): number | null {
  try {
    const cutoff = dayKey(8);
    const w: { date: string; weight: number }[] =
      JSON.parse(localStorage.getItem("sattvic-progress") ?? "[]")
        .filter((e: { date: string; weight?: number }) => e.weight && e.date >= cutoff)
        .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
    return w.length >= 2 ? w[w.length - 1].weight - w[0].weight : null;
  } catch { return null; }
}

// Projected weekly change if the meal plan is followed (avg planned day × 7).
export function planWeeklyKg(dayCalories: number[], maintenance: number): number | null {
  const planned = dayCalories.filter((c) => c > 0);
  if (!planned.length) return null;
  const avg = planned.reduce((a, b) => a + b, 0) / planned.length;
  return ((avg - maintenance) * 7) / KCAL_PER_KG;
}

export function fmtKg(kg: number): string {
  const r = Math.round(kg * 10) / 10;
  return r === 0 ? "±0.0 kg" : `${r > 0 ? "+" : ""}${r.toFixed(1)} kg`;
}
