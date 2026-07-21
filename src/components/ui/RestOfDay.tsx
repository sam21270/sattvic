"use client";

import { useState } from "react";
import { Loader2, Plus, Check, Target } from "lucide-react";
import { logMealToToday, loadTodayMeals } from "@/components/ui/AIFoodLog";

interface Suggestion { name: string; calories: number; protein: number; }

// "Rest of your day" — remaining budget (deterministic) + on-demand AI meal
// ideas that fill it. Shown once the user has logged at least one meal.
export function RestOfDay({
  consumed, targets,
}: {
  consumed: { calories: number; protein: number };
  targets: { calories: number; protein: number };
}) {
  const [meals, setMeals] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState<Record<number, boolean>>({});

  const remCal = Math.max(Math.round(targets.calories - consumed.calories), 0);
  const remProt = Math.max(Math.round(targets.protein - consumed.protein), 0);

  if (consumed.calories <= 0) return null; // nothing logged yet

  if (remCal < 250) {
    return (
      <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="text-2xl">🎯</span>
        <p className="text-sm text-zinc-300">You&apos;ve basically hit today&apos;s calorie goal — nicely done.</p>
      </div>
    );
  }

  async function suggest() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rest-of-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remainingCalories: remCal, remainingProtein: remProt, eaten: loadTodayMeals().map((m) => m.text) }),
      });
      const data = await res.json();
      setMeals(data.meals ?? []);
    } catch {
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/[0.04] border border-emerald-500/20 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Rest of your day</h2>
          <p className="text-xs text-zinc-500">
            <span className="text-emerald-400 font-semibold">{remCal} kcal</span> and{" "}
            <span className="text-blue-400 font-semibold">{remProt}g protein</span> left to hit your goal
          </p>
        </div>
      </div>

      {!meals && (
        <button
          onClick={suggest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Planning…</> : "Suggest meals to fill it"}
        </button>
      )}

      {meals && meals.length > 0 && (
        <div className="space-y-2">
          {meals.map((m, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300">{m.name}</p>
                <p className="text-[11px] text-zinc-600 tabular-nums">{m.calories} kcal · {m.protein}g protein</p>
              </div>
              <button
                onClick={() => { logMealToToday({ name: m.name, calories: m.calories, protein: m.protein, carbs: 0, fat: 0 }); setLogged((p) => ({ ...p, [i]: true })); }}
                className={`shrink-0 flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-colors ${logged[i] ? "text-emerald-400" : "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300"}`}
              >
                {logged[i] ? <><Check className="w-3.5 h-3.5" /> Logged</> : <><Plus className="w-3.5 h-3.5" /> Log</>}
              </button>
            </div>
          ))}
          <p className="text-[11px] text-zinc-600">Just ideas — eat what you like, this is here if it helps.</p>
        </div>
      )}
    </div>
  );
}
