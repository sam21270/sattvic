"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Scale, Flame, Droplets, Dumbbell, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { AIFoodLog } from "@/components/ui/AIFoodLog";

interface DayEntry {
  date: string;
  weight?: number;
  calories?: number;
  protein?: number;
  water?: number;
  workout?: number; // kcal burned
  mood?: 1 | 2 | 3 | 4 | 5;
}

const MOOD_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Rough" },
  2: { emoji: "😐", label: "Okay" },
  3: { emoji: "🙂", label: "Good" },
  4: { emoji: "😊", label: "Great" },
  5: { emoji: "🤩", label: "Amazing" },
};

function MiniSparkLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-10 flex items-center text-xs text-zinc-600">Not enough data</div>;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 40;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    weight: "",
    calories: "",
    protein: "",
    water: "",
    workout: "",
    mood: 3 as 1 | 2 | 3 | 4 | 5,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sattvic-progress");
      if (saved) setEntries(JSON.parse(saved));
    } catch {}
  }, []);

  function save(newEntries: DayEntry[]) {
    setEntries(newEntries);
    localStorage.setItem("sattvic-progress", JSON.stringify(newEntries));
  }

  function logToday() {
    const today = new Date().toISOString().split("T")[0];
    const existing = entries.findIndex((e) => e.date === today);
    const entry: DayEntry = {
      date: today,
      weight: form.weight ? Number(form.weight) : undefined,
      calories: form.calories ? Number(form.calories) : undefined,
      protein: form.protein ? Number(form.protein) : undefined,
      water: form.water ? Number(form.water) : undefined,
      workout: form.workout ? Number(form.workout) : undefined,
      mood: form.mood,
    };
    const updated = existing >= 0
      ? entries.map((e, i) => (i === existing ? entry : e))
      : [entry, ...entries];
    save(updated);
    setShowForm(false);
  }

  // series data (last 14 entries)
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const weights = sorted.map((e) => e.weight).filter(Boolean) as number[];
  const calories = sorted.map((e) => e.calories).filter(Boolean) as number[];
  const proteins = sorted.map((e) => e.protein).filter(Boolean) as number[];
  const waters = sorted.map((e) => e.water).filter(Boolean) as number[];

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

  const streaks = entries.length;

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
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Log today
          </button>
        </div>

        {/* AI food log — type what you ate, AI counts macros */}
        <AIFoodLog
          onTotalsChange={({ calories, protein }) =>
            setForm((f) => ({ ...f, calories: calories ? String(calories) : f.calories, protein: protein ? String(protein) : f.protein }))
          }
        />

        {/* log form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Today&apos;s check-in</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "weight", label: "Weight (kg)", placeholder: "e.g. 68.5", icon: Scale },
                { key: "calories", label: "Calories eaten", placeholder: "e.g. 1800", icon: Flame },
                { key: "protein", label: "Protein (g)", placeholder: "e.g. 80", icon: Dumbbell },
                { key: "water", label: "Water (ml)", placeholder: "e.g. 2000", icon: Droplets },
                { key: "workout", label: "Calories burned", placeholder: "e.g. 300", icon: TrendingUp },
              ].map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                    <Icon className="w-3 h-3" /> {label}
                  </label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={form[key as keyof typeof form] as string}
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
                    avg {Math.round(data.reduce((a, b) => a + b, 0) / data.length)} {unit}
                  </span>
                )}
              </div>
              <MiniSparkLine data={data} color={color} />
            </div>
          ))}
        </div>

        {/* mood history */}
        {entries.some((e) => e.mood) && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Mood journal</h3>
            <div className="flex gap-2 flex-wrap">
              {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map((e) => (
                <div key={e.date} className="flex flex-col items-center gap-0.5">
                  <span className="text-xl">{e.mood ? MOOD_MAP[e.mood].emoji : "—"}</span>
                  <span className="text-[9px] text-zinc-600">
                    {new Date(e.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* full history */}
        {entries.length > 0 && (
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
                  {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                    <tr key={e.date} className="border-t border-white/[0.05] text-zinc-300">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-400">
                        {new Date(e.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
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

        {entries.length === 0 && !showForm && (
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
