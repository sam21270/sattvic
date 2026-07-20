"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, Scale, Flame, Droplets, Dumbbell, Plus, ChevronUp, ChevronDown, CalendarDays } from "lucide-react";
import { AIFoodLog } from "@/components/ui/AIFoodLog";
import { WeekHistory } from "@/components/ui/WeekHistory";
import { maintenanceFromStorage, weekPrediction, actualWeekChange, fmtKg } from "@/lib/weightProjection";
import { dayKey } from "@/lib/scoring";

interface DayEntry {
  date: string;
  weight?: number;
  calories?: number;
  protein?: number;
  water?: number;
  workout?: number; // kcal burned
  mood?: 1 | 2 | 3 | 4 | 5;
}

// Date-only strings parse as UTC midnight — anchor to noon so the shown day
// never shifts in negative-offset timezones.
function fmtDate(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", opts);
}

const MOOD_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Rough" },
  2: { emoji: "😐", label: "Okay" },
  3: { emoji: "🙂", label: "Good" },
  4: { emoji: "😊", label: "Great" },
  5: { emoji: "🤩", label: "Amazing" },
};

// Bar per logged day, scaled from 0 — works from the very first log.
// Bars climb from 0 on mount via a plain CSS height transition.
function MiniBars({ data, color, unit }: { data: { date: string; value: number }[]; color: string; unit: string }) {
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    // setTimeout, not rAF — rAF never fires in background tabs, leaving bars at 0
    const t = setTimeout(() => setGrow(true), 30);
    return () => clearTimeout(t);
  }, []);
  if (data.length === 0)
    return <div className="h-20 flex items-center text-xs text-zinc-600">No data yet — fills in as you log</div>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
          <span className="text-[9px] text-zinc-500 tabular-nums">{d.value}{data.length <= 7 ? ` ${unit}` : ""}</span>
          <div
            className="w-full rounded-t-md transition-[height] duration-700 ease-out"
            style={{
              backgroundColor: color,
              height: grow ? Math.max((d.value / max) * 44, 3) : 0,
              transitionDelay: `${i * 60}ms`,
            }}
          />
          <span className="text-[9px] text-zinc-600">{fmtDate(d.date, { day: "numeric", month: "short" })}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [forecast, setForecast] = useState<{ days: number; avgIntake: number; kg: number; actual: number | null } | null>(null);
  // Everything pre-fills from existing logs — the form is glance-and-save.
  const [form, setForm] = useState({
    weight: "",
    water: "",
    workout: "",
    mood: 3 as 1 | 2 | 3 | 4 | 5,
  });

  // ponytail: ~0.04 kcal per step (walking average) — good enough without body-weight math
  function autoBurned(date: string): number {
    let burned = 0;
    try {
      const day = JSON.parse(localStorage.getItem(`sattvic-day-${date}`) ?? "{}");
      burned += Math.round((day.steps ?? 0) * 0.04);
    } catch {}
    try {
      const wlog = JSON.parse(localStorage.getItem("sattvic-workout-log") ?? "[]");
      burned += wlog
        .filter((e: { date: string }) => dayKey(new Date(e.date)) === date)
        .reduce((s: number, e: { calories: number }) => s + e.calories, 0);
    } catch {}
    return burned;
  }

  function openForm() {
    if (showForm) return setShowForm(false);
    const key = dayKey();
    let day: { water?: number } = {};
    try { day = JSON.parse(localStorage.getItem(`sattvic-day-${key}`) ?? "{}"); } catch {}
    const today = entries.find((e) => e.date === key);
    const lastWeight = [...entries].filter((e) => e.weight).sort((a, b) => a.date.localeCompare(b.date)).pop()?.weight;
    const burned = today?.workout ?? autoBurned(key);
    const weight = today?.weight ?? lastWeight;
    const water = today?.water ?? day.water;
    setForm({
      weight: weight ? String(weight) : "",
      water: water ? String(water) : "",
      workout: burned ? String(burned) : "",
      mood: today?.mood ?? 3,
    });
    setShowForm(true);
  }

  const [merged, setMerged] = useState<DayEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sattvic-progress");
      if (saved) setEntries(JSON.parse(saved));
    } catch {}
    const m = maintenanceFromStorage();
    const p = m ? weekPrediction(m) : null;
    if (p) setForecast({ ...p, actual: actualWeekChange() });
  }, []);

  // Charts pull from EVERYTHING the app already tracks — food logs, dashboard
  // water/steps, workouts — so trends fill in without manual re-entry.
  useEffect(() => {
    const byDate = new Map(entries.map((e) => [e.date, e]));
    const out: DayEntry[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = dayKey(i);
      const manual = byDate.get(date) ?? { date };
      let cal = 0, prot = 0, water: number | undefined;
      try {
        const food = JSON.parse(localStorage.getItem(`sattvic-foodlog-${date}`) ?? "[]");
        for (const m of food) { cal += m.totals?.calories ?? 0; prot += m.totals?.protein ?? 0; }
      } catch {}
      try { water = JSON.parse(localStorage.getItem(`sattvic-day-${date}`) ?? "{}").water || undefined; } catch {}
      const burned = autoBurned(date);
      const e: DayEntry = {
        ...manual,
        date,
        calories: manual.calories ?? (cal || undefined),
        protein: manual.protein ?? (prot || undefined),
        water: manual.water ?? water,
        workout: manual.workout ?? (burned || undefined),
      };
      if (e.weight || e.calories || e.protein || e.water || e.workout || e.mood) out.push(e);
    }
    setMerged(out);
  }, [entries]);

  function save(newEntries: DayEntry[]) {
    setEntries(newEntries);
    localStorage.setItem("sattvic-progress", JSON.stringify(newEntries));
  }

  function logToday() {
    const today = dayKey();
    const existing = entries.findIndex((e) => e.date === today);
    // merge onto whatever the day already has — never wipe auto-derived data
    const entry: DayEntry = {
      ...(existing >= 0 ? entries[existing] : {}),
      date: today,
      weight: form.weight ? Number(form.weight) : entries[existing]?.weight,
      water: form.water ? Number(form.water) : entries[existing]?.water,
      workout: form.workout ? Number(form.workout) : entries[existing]?.workout,
      mood: form.mood,
    };
    const updated = existing >= 0
      ? entries.map((e, i) => (i === existing ? entry : e))
      : [entry, ...entries];
    save(updated);
    setShowForm(false);
  }

  // series data (last 14 days, auto-derived)
  const sorted = merged;
  const series = (key: keyof DayEntry) =>
    sorted.filter((e) => e[key]).map((e) => ({ date: e.date, value: e[key] as number }));
  const weights = series("weight");
  const calories = series("calories");
  const proteins = series("protein");
  const waters = series("water");

  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  function delta(key: keyof DayEntry) {
    if (!latest || !prev) return null;
    const a = latest[key] as number | undefined;
    const b = prev[key] as number | undefined;
    if (!a || !b) return null;
    return a - b;
  }

  function Chip({ val, unit, invert = false }: { val: number | null; unit: string; invert?: boolean }) {
    if (val === null) return null;
    const good = invert ? val < 0 : val > 0;
    return (
      <span className={`text-xs font-semibold ${good ? "text-emerald-400" : "text-rose-400"}`}>
        {val > 0 ? "+" : ""}{val.toFixed(1)}{unit}
      </span>
    );
  }

  const streaks = merged.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Progress</h1>
              <p className="text-sm text-zinc-500">{streaks} day{streaks !== 1 ? "s" : ""} logged · keep going!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/meal-planner"
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.1] text-zinc-300 rounded-xl font-semibold hover:bg-white/[0.09] transition-colors text-sm"
            >
              <CalendarDays className="w-4 h-4" />
              Meal Plan
            </Link>
            <button
              onClick={openForm}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Log today
            </button>
          </div>
        </div>

        {/* end-of-week forecast: predicted (from food logs) vs actual (scale) */}
        {forecast && (
          <div className="bg-violet-500/[0.07] border border-violet-500/20 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
            <span className="text-2xl">⚖️</span>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-zinc-300">
                <span className="font-bold text-violet-300">Predicted this week: {fmtKg(forecast.kg)}</span>
                {forecast.actual !== null && (
                  <span className="text-zinc-400"> · scale says <span className="font-bold text-white">{fmtKg(forecast.actual)}</span></span>
                )}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                From {forecast.days} logged day{forecast.days !== 1 ? "s" : ""} averaging {forecast.avgIntake} kcal.
                {forecast.actual === null && " Weigh in twice this week to compare against the scale."}
              </p>
            </div>
          </div>
        )}

        {/* AI food log — type what you ate, AI counts macros */}
        <AIFoodLog />

        {/* log form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Today&apos;s check-in</h2>
            <p className="text-xs text-zinc-500 -mt-2">
              Already filled in from your logs — weight carries over, burned is calculated from your steps and workouts. Tweak anything, then save.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "weight", label: "Weight (kg)", placeholder: "e.g. 68.5", icon: Scale },
                { key: "water", label: "Water (ml)", placeholder: "e.g. 2000", icon: Droplets },
                { key: "workout", label: "Calories burned", placeholder: "auto from steps", icon: TrendingUp },
              ].map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                    <Icon className="w-3 h-3" /> {label}
                  </label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={form[key as "weight" | "water" | "workout"]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Mood</label>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm({ ...form, mood: m })}
                      className={`flex-1 py-2 rounded-lg text-lg transition-colors ${
                        form.mood === m ? "bg-white/10" : "hover:bg-white/[0.05]"
                      }`}
                    >
                      {MOOD_MAP[m].emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={logToday}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
            >
              Save check-in
            </button>
          </motion.div>
        )}

        {/* current stats */}
        {latest && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Weight", value: latest.weight, unit: " kg", icon: Scale, cls: "text-violet-400", key: "weight", invert: true },
              { label: "Calories", value: latest.calories, unit: " kcal", icon: Flame, cls: "text-rose-400", key: "calories" },
              { label: "Protein", value: latest.protein, unit: "g", icon: Dumbbell, cls: "text-emerald-400", key: "protein" },
              { label: "Water", value: latest.water, unit: " ml", icon: Droplets, cls: "text-sky-400", key: "water" },
            ].map(({ label, value, unit, icon: Icon, cls, key, invert }) => {
              const d = delta(key as keyof DayEntry);
              return (
                <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Icon className={`w-3 h-3 ${cls}`} />{label}
                    </span>
                    {d !== null && <Chip val={d} unit={unit.trim()} invert={invert} />}
                  </div>
                  <div className={`text-xl font-black ${cls}`}>
                    {value ?? "—"}<span className="text-sm font-normal text-zinc-500">{value ? unit : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* charts */}
        <div className="space-y-3">
          {[
            // `cls` drives the label (theme-aware via globals.css); `color`
            // stays a literal hex for the SVG stroke, which needs no remap.
            { label: "Weight trend", data: weights, color: "#8b5cf6", cls: "text-violet-400", unit: "kg" },
            { label: "Daily calories", data: calories, color: "#ef4444", cls: "text-rose-400", unit: "kcal" },
            { label: "Protein intake", data: proteins, color: "#10b981", cls: "text-emerald-400", unit: "g" },
            { label: "Water intake", data: waters, color: "#38bdf8", cls: "text-sky-400", unit: "ml" },
          ].map(({ label, data, color, cls, unit }) => (
            <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${cls}`}>{label}</span>
                {data.length > 0 && (
                  <span className="text-xs text-zinc-500">
                    avg {Math.round(data.reduce((a, b) => a + b.value, 0) / data.length)} {unit}
                  </span>
                )}
              </div>
              <MiniBars data={data} color={color} unit={unit} />
            </div>
          ))}
        </div>

        {/* per-day meal history — read-only once the day has passed */}
        <WeekHistory />

        {/* mood history */}
        {entries.some((e) => e.mood) && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Mood journal</h3>
            <div className="flex gap-2 flex-wrap">
              {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map((e) => (
                <div key={e.date} className="flex flex-col items-center gap-0.5">
                  <span className="text-xl">{e.mood ? MOOD_MAP[e.mood].emoji : "—"}</span>
                  <span className="text-[9px] text-zinc-600">
                    {fmtDate(e.date, { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* full history */}
        {merged.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Full history</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-600 uppercase tracking-wider">
                    <th className="pb-2 pr-3 font-semibold">Date</th>
                    <th className="pb-2 pr-3 font-semibold">Weight</th>
                    <th className="pb-2 pr-3 font-semibold">Calories</th>
                    <th className="pb-2 pr-3 font-semibold">Protein</th>
                    <th className="pb-2 pr-3 font-semibold">Water</th>
                    <th className="pb-2 pr-3 font-semibold">Burned</th>
                    <th className="pb-2 font-semibold">Mood</th>
                  </tr>
                </thead>
                <tbody>
                  {[...merged].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                    <tr key={e.date} className="border-t border-white/[0.05] text-zinc-300">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-400">
                        {fmtDate(e.date, { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{e.weight ? `${e.weight} kg` : "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{e.calories ? `${e.calories} kcal` : "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{e.protein ? `${e.protein}g` : "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{e.water ? `${e.water} ml` : "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{e.workout ? `${e.workout} kcal` : "—"}</td>
                      <td className="py-2.5">{e.mood ? MOOD_MAP[e.mood].emoji : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {merged.length === 0 && !showForm && (
          <div className="text-center py-16 text-zinc-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No data yet</p>
            <p className="text-sm mt-1">Tap &quot;Log today&quot; to start your progress journey</p>
          </div>
        )}
      </div>
    </div>
  );
}
