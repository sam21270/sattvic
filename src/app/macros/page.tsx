"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calculator, Loader2, ArrowRight } from "lucide-react";
import { MacroTargets } from "@/types";

const activityLevels = [
  { value: "sedentary", label: "Sedentary (desk job, no exercise)" },
  { value: "light", label: "Lightly active (1-3 days/week)" },
  { value: "moderate", label: "Moderately active (3-5 days/week)" },
  { value: "very_active", label: "Very active (6-7 days/week)" },
];

const goals = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain", label: "Maintain weight" },
  { value: "gain_muscle", label: "Gain muscle" },
];

export default function MacrosPage() {
  return (
    <Suspense fallback={null}>
      <MacrosCalculator />
    </Suspense>
  );
}

function MacrosCalculator() {
  const searchParams = useSearchParams();
  const inJourney = searchParams.get("journey") === "1";
  const [form, setForm] = useState({
    weight: "", height: "", age: "", gender: "female",
    activityLevel: "moderate", goal: "maintain",
  });
  const [pace, setPace] = useState<"gentle" | "aggressive">("gentle");
  const [result, setResult] = useState<
    (MacroTargets & { phases?: { label: string; calories: number; note: string }[]; maintenance?: number }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: Number(form.weight),
          height: Number(form.height),
          age: Number(form.age),
          gender: form.gender,
          activityLevel: form.activityLevel,
          goal: form.goal,
          pace,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.setItem("sattvic-macro-targets", JSON.stringify(data));
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Macro Calculator</h1>
        <p className="text-zinc-500 mt-1">Get personalized daily macro targets based on your body and goals.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#141414] rounded-2xl border border-white/[0.1] p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "weight", label: "Weight (kg)", placeholder: "70" },
            { name: "height", label: "Height (cm)", placeholder: "170" },
            { name: "age", label: "Age", placeholder: "28" },
          ].map((f) => (
            <div key={f.name} className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-200">{f.label}</label>
              <input
                type="number"
                placeholder={f.placeholder}
                value={(form as any)[f.name]}
                onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                className="w-full border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-200">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              className="w-full border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-200">Activity Level</label>
          <select
            value={form.activityLevel}
            onChange={(e) => setForm((p) => ({ ...p, activityLevel: e.target.value }))}
            className="w-full border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {activityLevels.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-200">Goal</label>
          <div className="grid grid-cols-3 gap-2">
            {goals.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, goal: g.value }))}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors ${
                  form.goal === g.value
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white/[0.04] text-zinc-400 border-white/[0.1] hover:bg-white/[0.08] hover:text-zinc-200"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {form.goal === "lose_weight" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-200">Pace</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPace("gentle")}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                  pace === "gentle" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/[0.04] text-zinc-400 border-white/[0.1] hover:bg-white/[0.08] hover:text-zinc-200"
                }`}
              >
                🌱 Ease me in
                <span className="block text-xs opacity-75 mt-0.5">Gradual taper — recommended</span>
              </button>
              <button
                type="button"
                onClick={() => setPace("aggressive")}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                  pace === "aggressive" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/[0.04] text-zinc-400 border-white/[0.1] hover:bg-white/[0.08] hover:text-zinc-200"
                }`}
              >
                🔥 Aggressive
                <span className="block text-xs opacity-75 mt-0.5">Bigger deficit, faster results</span>
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/25 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          {loading ? "Calculating…" : "Calculate My Macros"}
        </button>
      </form>

      {result && (
        <div className="bg-[#141414] rounded-2xl border border-white/[0.1] p-6 space-y-5">
          <h2 className="font-semibold text-zinc-100">Your Daily Targets</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Calories", value: result.calories, unit: "kcal", color: "bg-orange-500/10 text-orange-300 border border-orange-500/20" },
              { label: "Protein", value: result.protein, unit: "g", color: "bg-blue-500/10 text-blue-300 border border-blue-500/20" },
              { label: "Carbs", value: result.carbs, unit: "g", color: "bg-amber-500/10 text-amber-300 border border-amber-500/20" },
              { label: "Fat", value: result.fat, unit: "g", color: "bg-rose-500/10 text-rose-300 border border-rose-500/20" },
              { label: "Fiber", value: result.fiber, unit: "g", color: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" },
            ].map((m) => (
              <div key={m.label} className={`rounded-xl p-3 text-center ${m.color}`}>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs font-medium opacity-75">{m.unit}</p>
                <p className="text-xs font-semibold mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          {result.phases && (
            <div className="border-t border-white/[0.07] pt-4 space-y-2">
              <h3 className="text-sm font-bold text-zinc-200">Your ramp-down plan — don&apos;t jump straight to the target</h3>
              {result.phases.map((p, i) => (
                <div key={p.label} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{p.label} — {p.calories} kcal/day</p>
                    <p className="text-xs text-zinc-500">{p.note}</p>
                  </div>
                </div>
              ))}
              {result.maintenance && (
                <p className="text-xs text-zinc-600">Your maintenance is ≈{result.maintenance} kcal — every phase stays safely below it, never crash-level.</p>
              )}
            </div>
          )}
          {result.explanation && (
            <p className="text-sm text-zinc-500 leading-relaxed border-t border-white/[0.07] pt-4">
              {result.explanation}
            </p>
          )}
          {inJourney && (
            <Link
              href="/meal-planner?journey=1"
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition-colors"
            >
              Next: Build your meal plan <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
