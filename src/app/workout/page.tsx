"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Clock, Flame, Plus, Trash2, ChevronDown, TrendingUp } from "lucide-react";
import { Confetti } from "@/components/ui/Confetti";

interface WorkoutEntry {
  id: string;
  activity: string;
  duration: number; // minutes
  intensity: "light" | "moderate" | "vigorous";
  calories: number;
  date: string;
}

interface Activity {
  name: string;
  emoji: string;
  met: { light: number; moderate: number; vigorous: number };
}

const ACTIVITIES: Activity[] = [
  { name: "Running", emoji: "🏃", met: { light: 6, moderate: 9.8, vigorous: 14 } },
  { name: "Cycling", emoji: "🚴", met: { light: 4, moderate: 8, vigorous: 12 } },
  { name: "Swimming", emoji: "🏊", met: { light: 5, moderate: 7, vigorous: 10 } },
  { name: "Yoga", emoji: "🧘", met: { light: 2.5, moderate: 4, vigorous: 6 } },
  { name: "Weight Training", emoji: "🏋️", met: { light: 3, moderate: 5, vigorous: 8 } },
  { name: "Jump Rope", emoji: "🪢", met: { light: 8, moderate: 10, vigorous: 13 } },
  { name: "Dance", emoji: "💃", met: { light: 3, moderate: 5, vigorous: 7.5 } },
  { name: "Hiking", emoji: "🥾", met: { light: 4, moderate: 6, vigorous: 8 } },
  { name: "HIIT", emoji: "⚡", met: { light: 6, moderate: 9, vigorous: 12 } },
  { name: "Pilates", emoji: "🤸", met: { light: 2.8, moderate: 4.5, vigorous: 6 } },
  { name: "Badminton", emoji: "🏸", met: { light: 4, moderate: 6, vigorous: 8 } },
  { name: "Walking", emoji: "🚶", met: { light: 2.5, moderate: 3.5, vigorous: 5 } },
];

const INTENSITY_LABELS = {
  light: { label: "Light", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  moderate: { label: "Moderate", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  vigorous: { label: "Vigorous", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
};

// Average weight 70kg for MET calculation
const BODY_WEIGHT_KG = 70;

function calcCalories(activity: Activity, duration: number, intensity: "light" | "moderate" | "vigorous") {
  const met = activity.met[intensity];
  return Math.round((met * BODY_WEIGHT_KG * duration) / 60);
}

export default function WorkoutPage() {
  const [log, setLog] = useState<WorkoutEntry[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity>(ACTIVITIES[0]);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<"light" | "moderate" | "vigorous">("moderate");
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [todayGoal] = useState(400); // kcal goal

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sattvic-workout-log");
      if (saved) setLog(JSON.parse(saved));
    } catch {}
  }, []);

  function saveLog(newLog: WorkoutEntry[]) {
    setLog(newLog);
    localStorage.setItem("sattvic-workout-log", JSON.stringify(newLog));
  }

  const preview = calcCalories(selectedActivity, duration, intensity);

  const today = new Date().toDateString();
  const todayLog = log.filter((e) => new Date(e.date).toDateString() === today);
  const todayCalories = todayLog.reduce((sum, e) => sum + e.calories, 0);

  function addWorkout() {
    const entry: WorkoutEntry = {
      id: Date.now().toString(),
      activity: selectedActivity.name,
      duration,
      intensity,
      calories: preview,
      date: new Date().toISOString(),
    };
    const newLog = [entry, ...log];
    saveLog(newLog);

    if (todayCalories + preview >= todayGoal) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 100);
    }
  }

  function removeEntry(id: string) {
    saveLog(log.filter((e) => e.id !== id));
  }

  const weekLog = log.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff < 7;
  });
  const weekCalories = weekLog.reduce((sum, e) => sum + e.calories, 0);
  const weekMinutes = weekLog.reduce((sum, e) => sum + e.duration, 0);
  const weekSessions = weekLog.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16">
      <Confetti trigger={confetti} />
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Workout Tracker</h1>
              <p className="text-sm text-zinc-500">Log workouts, burn calories, close your rings</p>
            </div>
          </div>
        </div>

        {/* weekly summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Week calories", value: weekCalories, suffix: " kcal", icon: "🔥", color: "text-rose-400" },
            { label: "Active time", value: weekMinutes, suffix: " min", icon: "⏱️", color: "text-amber-400" },
            { label: "Sessions", value: weekSessions, suffix: "", icon: "💪", color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}{s.suffix}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* today's goal ring */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-zinc-300">Today&apos;s burn goal</span>
            <span className="text-sm text-zinc-500">{todayCalories} / {todayGoal} kcal</span>
          </div>
          <div className="w-full bg-white/[0.05] rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todayCalories / todayGoal) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {todayCalories >= todayGoal && (
            <p className="text-xs text-emerald-400 mt-2 font-semibold">🎉 Goal smashed! Great work!</p>
          )}
        </div>

        {/* add workout form */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Log a Workout</h2>

          {/* activity picker */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Activity</label>
            <button
              onClick={() => setShowActivityPicker(!showActivityPicker)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white hover:bg-white/[0.09] transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{selectedActivity.emoji}</span>
                <span className="font-semibold">{selectedActivity.name}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showActivityPicker ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showActivityPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ACTIVITIES.map((a) => (
                      <button
                        key={a.name}
                        onClick={() => { setSelectedActivity(a); setShowActivityPicker(false); }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors text-xs font-medium ${
                          selectedActivity.name === a.name
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:bg-white/[0.07]"
                        }`}
                      >
                        <span className="text-2xl">{a.emoji}</span>
                        {a.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* duration slider */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">
              Duration — <span className="text-white font-bold">{duration} min</span>
            </label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>5 min</span><span>120 min</span>
            </div>
          </div>

          {/* intensity */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Intensity</label>
            <div className="flex gap-2">
              {(["light", "moderate", "vigorous"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setIntensity(lvl)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    intensity === lvl
                      ? INTENSITY_LABELS[lvl].bg + " " + INTENSITY_LABELS[lvl].color
                      : "bg-white/[0.03] border-white/[0.07] text-zinc-500 hover:bg-white/[0.07]"
                  }`}
                >
                  {INTENSITY_LABELS[lvl].label}
                </button>
              ))}
            </div>
          </div>

          {/* preview + add */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-white font-black text-lg">{preview}</span>
              <span className="text-zinc-400 text-sm">kcal burned</span>
            </div>
            <button
              onClick={addWorkout}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log
            </button>
          </div>
        </div>

        {/* today's log */}
        {todayLog.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-3">Today</h2>
            <div className="space-y-2">
              <AnimatePresence>
                {todayLog.map((entry) => {
                  const act = ACTIVITIES.find((a) => a.name === entry.activity) ?? ACTIVITIES[0];
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl"
                    >
                      <span className="text-2xl">{act.emoji}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{entry.activity}</div>
                        <div className="text-xs text-zinc-500">
                          {entry.duration} min · {INTENSITY_LABELS[entry.intensity].label}
                        </div>
                      </div>
                      <div className="text-rose-400 font-bold text-sm mr-2">-{entry.calories} kcal</div>
                      <button onClick={() => removeEntry(entry.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* full history */}
        {log.length > todayLog.length && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-3">History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {log.filter((e) => new Date(e.date).toDateString() !== today).map((entry) => {
                const act = ACTIVITIES.find((a) => a.name === entry.activity) ?? ACTIVITIES[0];
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
                    <span className="text-lg">{act.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm text-zinc-300">{entry.activity}</div>
                      <div className="text-xs text-zinc-600">
                        {new Date(entry.date).toLocaleDateString()} · {entry.duration} min
                      </div>
                    </div>
                    <div className="text-zinc-400 text-sm">-{entry.calories} kcal</div>
                    <button onClick={() => removeEntry(entry.id)} className="text-zinc-700 hover:text-zinc-500 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
