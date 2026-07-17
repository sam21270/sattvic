"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Droplets, TrendingUp, PartyPopper, AlertCircle } from "lucide-react";
import { WeekHistory } from "@/components/ui/WeekHistory";
import { DAILY_B12_MCG, DAILY_IRON_MG } from "@/lib/micronutrients";
import { MacroRing } from "@/components/ui/MacroRing";
import { MacroBar } from "@/components/ui/MacroBar";
import { SattvicScore } from "@/components/ui/SattvicScore";
import { AIFoodLog } from "@/components/ui/AIFoodLog";
import { ActivityRings } from "@/components/ui/ActivityRings";
import { WaterTracker } from "@/components/ui/WaterTracker";
import { StreakFire } from "@/components/ui/StreakFire";
import { Confetti } from "@/components/ui/Confetti";
import { calculateScore, loadHistory, saveToHistory, DayLog, ScoreBreakdown, HistoryEntry, ScoreTargets } from "@/lib/scoring";

const DEFAULT_TARGETS: ScoreTargets = { calories: 2000, protein: 120, carbs: 200, fat: 65, fiber: 30 };
const WATER_GOAL = 2500;

const INITIAL_LOG: DayLog = {
  date: new Date().toISOString().slice(0, 10),
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  b12: 0,
  iron: 0,
  mealsLogged: 0,
};

const segments = [
  { label: "Protein", value: 0, color: "#3b82f6", bgColor: "bg-blue-50",    textColor: "text-blue-600"    },
  { label: "Carbs",   value: 0, color: "#f59e0b", bgColor: "bg-amber-50",   textColor: "text-amber-600"   },
  { label: "Fat",     value: 0, color: "#f43f5e", bgColor: "bg-rose-50",    textColor: "text-rose-600"    },
  { label: "Fiber",   value: 0, color: "#10b981", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const searchParams = useSearchParams();
  const justFinishedJourney = searchParams.get("journey") === "1";
  const [showJourneyBanner, setShowJourneyBanner] = useState(justFinishedJourney);
  const [log, setLog] = useState<DayLog>(INITIAL_LOG);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState(0);
  const [workoutCalories, setWorkoutCalories] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const [targets, setTargets] = useState<ScoreTargets>(DEFAULT_TARGETS);

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    // load persisted daily values
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = JSON.parse(localStorage.getItem(`sattvic-day-${today}`) ?? "{}");
      if (saved.water) setWater(saved.water);
      if (saved.steps) setSteps(saved.steps);
    } catch {}
    // load workout calories burned today
    try {
      const wlog = JSON.parse(localStorage.getItem("sattvic-workout-log") ?? "[]");
      const todayKcal = wlog
        .filter((e: any) => new Date(e.date).toISOString().slice(0, 10) === today)
        .reduce((s: number, e: any) => s + e.calories, 0);
      setWorkoutCalories(todayKcal);
    } catch {}
    // load personalised macro targets from the macro calculator
    try {
      const savedTargets = JSON.parse(localStorage.getItem("sattvic-macro-targets") ?? "null");
      if (savedTargets) setTargets((t) => ({ ...t, ...savedTargets }));
    } catch {}
    // load dosha result from the quiz
    try {
      const dosha = localStorage.getItem("sattvic-dosha") as DayLog["dosha"] | null;
      if (dosha) setLog((l) => ({ ...l, dosha }));
    } catch {}
  }, []);

  // persist water + steps
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`sattvic-day-${today}`, JSON.stringify({ water, steps }));
  }, [water, steps]);

  useEffect(() => {
    const h = loadHistory();
    const bd = calculateScore(log, h, targets);
    setBreakdown(bd);
    saveToHistory(bd.total, bd.grade);
    setHistory(loadHistory());

    // confetti on calorie goal hit (only once per session)
    if (!confettiFired && log.calories >= targets.calories && log.mealsLogged > 0) {
      setConfetti(true);
      setConfettiFired(true);
      setTimeout(() => setConfetti(false), 100);
    }
  }, [log, targets]); // eslint-disable-line

  useEffect(() => {
    if (justFinishedJourney) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 100);
    }
  }, [justFinishedJourney]);

  useEffect(() => {
    if (!breakdown || log.mealsLogged === 0) return;
    setInsightLoading(true);
    setInsight("");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/score-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: breakdown.total, breakdown, log }),
        });
        const data = await res.json();
        setInsight(data.insight ?? "");
      } catch { setInsight(""); }
      finally { setInsightLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [log.mealsLogged]); // eslint-disable-line


  const remaining = Math.max(targets.calories - log.calories, 0);
  const streak = history.filter((h) => h.score >= 50).length;
  const netCalories = log.calories - workoutCalories;

  const liveSegments = segments.map((s, i) => ({
    ...s,
    value: [log.protein, log.carbs, log.fat, log.fiber][i],
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Confetti trigger={confetti} />

      {showJourneyBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4"
        >
          <PartyPopper className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">
            <span className="font-semibold">You finished the journey!</span> Quiz, macros, and meal plan are done — this is your home base now. Log a meal below to start your Sattvic Score.
          </p>
          <button onClick={() => setShowJourneyBanner(false)} className="text-emerald-400/60 hover:text-emerald-300 text-xs font-medium shrink-0">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1">
          {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">{greeting()}, Sanika 👋</h1>
          <StreakFire streak={streak} size="md" />
        </div>
        <p className="text-zinc-500 mt-1">
          {log.mealsLogged === 0
            ? "Log your first meal to start your Sattvic Score."
            : remaining > 0
            ? <>You have <span className="text-emerald-400 font-semibold">{remaining} kcal</span> left today.</>
            : "🎉 You've hit your calorie target today!"}
        </p>
      </motion.div>

      {/* stat chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Net Calories", value: netCalories, unit: "kcal", icon: Flame,     iconColor: "text-orange-400", glowColor: "bg-orange-500/10" },
          { label: "Water",        value: water,       unit: "ml",   icon: Droplets,  iconColor: "text-sky-400",    glowColor: "bg-sky-500/10"    },
          { label: "Streak",       value: streak,      unit: "days", icon: TrendingUp, iconColor: "text-emerald-400", glowColor: "bg-emerald-500/10"},
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="bg-[#141414] border border-white/[0.07] rounded-3xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${card.glowColor} shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-600 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-white leading-tight">
                {card.value}<span className="text-sm font-normal text-zinc-600 ml-1">{card.unit}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* main grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.55 }}>
          {breakdown && (
            <SattvicScore
              breakdown={breakdown}
              history={history}
              insight={insight}
              insightLoading={insightLoading}
            />
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.55 }}>
          {/* ponytail: free-form AI logging replaced the 5-slot MealLogger —
              "1 banana, 1 cup poha, 3 biscuits" any time, any number of meals */}
          <AIFoodLog onTotalsChange={(t) => setLog((l) => ({ ...l, ...t }))} />
        </motion.div>
      </div>

      {/* activity + water row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* activity rings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 flex flex-col items-center gap-4"
        >
          <h2 className="font-bold text-zinc-100 text-base self-start">Activity Rings</h2>
          <ActivityRings
            steps={steps}
            calories={workoutCalories}
            activeMinutes={Math.round(workoutCalories / 7)}
          />
          {/* steps input */}
          <div className="w-full">
            <label className="text-xs text-zinc-500 mb-1 block">Today&apos;s steps</label>
            <input
              type="number"
              placeholder="e.g. 8000"
              value={steps || ""}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </motion.div>

        {/* water tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 flex flex-col items-center gap-2"
        >
          <h2 className="font-bold text-zinc-100 text-base self-start mb-2">Water Intake</h2>
          <WaterTracker
            current={water}
            goal={WATER_GOAL}
            onAdd={(ml) => setWater((w) => Math.max(0, Math.min(w + ml, WATER_GOAL * 1.5)))}
          />
        </motion.div>

        {/* macro bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 space-y-5"
        >
          <h2 className="font-bold text-zinc-100 text-base">Daily Progress</h2>
          <MacroBar label="Calories" value={log.calories} max={targets.calories} color="bg-orange-400" unit=" kcal" />
          <MacroBar label="Protein"  value={log.protein}  max={targets.protein}  color="bg-blue-400"   />
          <MacroBar label="Carbs"    value={log.carbs}    max={targets.carbs}    color="bg-amber-400"  />
          <MacroBar label="Fat"      value={log.fat}      max={targets.fat}      color="bg-rose-400"   />
          <MacroBar label="Fiber"    value={log.fiber}    max={targets.fiber}    color="bg-emerald-400"/>
          <div className="border-t border-white/[0.06] pt-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Vegetarian Micronutrients</p>
            <MacroBar label="Vitamin B12" value={Math.round(log.b12 * 10) / 10} max={DAILY_B12_MCG} color="bg-violet-400" unit=" mcg" decimals={1} />
            <MacroBar label="Iron"        value={Math.round(log.iron * 10) / 10} max={DAILY_IRON_MG} color="bg-rose-300"  unit=" mg"  decimals={1} />
            {log.mealsLogged > 0 && log.b12 < DAILY_B12_MCG * 0.5 && (
              <p className="flex items-start gap-1.5 text-[11px] text-violet-400/80">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Low B12 today — add dairy, eggs, or a fortified food to your next meal.
              </p>
            )}
            {log.mealsLogged > 0 && log.iron < DAILY_IRON_MG * 0.4 && (
              <p className="flex items-start gap-1.5 text-[11px] text-rose-400/80">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Low iron — try dal, rajma, spinach or chickpeas with your next meal.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* past 7 days history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        <WeekHistory />
      </motion.div>

      {/* macro ring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-[#141414] border border-white/[0.07] rounded-3xl p-7 shadow-sm"
      >
        <h2 className="font-bold text-zinc-100 text-lg mb-6">Today&apos;s Macros</h2>
        <MacroRing calories={log.calories} calorieTarget={targets.calories} segments={liveSegments} />
      </motion.div>

      {/* reset */}
      <ResetSection />
    </div>
  );
}

function ResetSection() {
  const [confirm, setConfirm] = useState(false);

  function resetAll() {
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith("sattvic")
    );
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.href = "/";
  }

  return (
    <div className="border-t border-white/[0.05] pt-6 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-zinc-600">Reset all data</p>
        <p className="text-[11px] text-zinc-700 mt-0.5">Clears your quiz, macros, meal logs and history</p>
      </div>
      {confirm ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Sure?</span>
          <button
            onClick={resetAll}
            className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            Yes, reset everything
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="text-xs font-semibold text-zinc-600 hover:text-rose-400 border border-white/[0.07] px-3 py-1.5 rounded-lg hover:border-rose-500/20 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );
}
