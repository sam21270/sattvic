"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { ScoreBreakdown, HistoryEntry, dayKey } from "@/lib/scoring";

const SIZE = 200;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

interface SattvicScoreProps {
  breakdown: ScoreBreakdown;
  history: HistoryEntry[];
  insight: string;
  insightLoading: boolean;
}

const breakdownItems = [
  { key: "calorie", label: "Calories",   max: 25, color: "#f97316" },
  { key: "protein", label: "Protein",    max: 30, color: "#3b82f6" },
  { key: "balance", label: "Meals",      max: 20, color: "#8b5cf6" },
  { key: "dosha",   label: "Dosha",      max: 15, color: "#10b981" },
  { key: "streak",  label: "Streak",     max: 10, color: "#f59e0b" },
] as const;

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [shown, setShown] = useState(0);

  useEffect(() => { spring.set(value); }, [value, spring]);
  useEffect(() => display.on("change", setShown), [display]);

  return <span>{shown}</span>;
}

function WeekChart({ history }: { history: HistoryEntry[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    // shift by the same 4am rollover as dayKey so labels match the logical day
    const d = new Date(Date.now() - (6 - i) * 86400000 - 4 * 3600000);
    const key = dayKey(6 - i);
    const entry = history.find((h) => h.date === key);
    return { label: days[d.getDay() === 0 ? 6 : d.getDay() - 1], score: entry?.score ?? null, isToday: i === 6 };
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">7-Day History</p>
      <div className="flex items-end gap-1.5 h-16">
        {last7.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              {d.score !== null ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${d.score}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                  className="w-full rounded-t-md"
                  style={{
                    backgroundColor: d.score >= 75 ? "#10b981" : d.score >= 55 ? "#f59e0b" : "#f97316",
                    minHeight: 4,
                  }}
                />
              ) : (
                <div className="w-full rounded-t-md bg-white/[0.06]" style={{ height: "4px" }} />
              )}
            </div>
            <span className={`text-[10px] font-medium ${d.isToday ? "text-emerald-600" : "text-zinc-600"}`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SattvicScore({ breakdown, history, insight, insightLoading }: SattvicScoreProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const dashOffset = mounted ? CIRC - (breakdown.total / 100) * CIRC : CIRC;

  return (
    <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-7 shadow-sm space-y-7">

      {/* top — ring + breakdown */}
      <div className="flex flex-col sm:flex-row items-center gap-8">

        {/* ring */}
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#f0ede8" strokeWidth={STROKE} />
            <motion.circle
              cx={SIZE/2} cy={SIZE/2} r={R}
              fill="none"
              stroke={breakdown.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-5xl font-black text-white leading-none">
              <AnimatedNumber value={breakdown.total} />
            </p>
            <p className="text-xs text-zinc-600 font-medium mt-1">out of 100</p>
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-2 text-sm font-bold px-3 py-0.5 rounded-full text-white"
              style={{ backgroundColor: breakdown.color }}
            >
              {breakdown.grade === "S" ? "S Rank" : `Grade ${breakdown.grade}`}
            </motion.span>
          </div>
        </div>

        {/* breakdown bars */}
        <div className="flex-1 w-full space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">Score Breakdown</p>
          {breakdownItems.map((item, i) => {
            // Dosha is optional — hide the row entirely if the quiz wasn't taken
            if (item.key === "dosha" && !breakdown.hasDosha) return null;
            const val = breakdown[item.key];
            const pct = (val / item.max) * 100;
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="text-zinc-100">{val} / {item.max}</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI insight */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 min-h-[56px] flex items-center gap-3">
        <span className="text-xl shrink-0">🌿</span>
        {insightLoading ? (
          <div className="flex gap-1.5 items-center">
            {[0,1,2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-stone-400"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            {insight || `${breakdown.label} — keep going.`}
          </p>
        )}
      </div>

      {/* 7-day chart */}
      <WeekChart history={history} />

      {/* status label */}
      <div className="flex items-center justify-between text-sm border-t border-white/[0.07] pt-4">
        <span className="font-semibold text-zinc-200">{breakdown.label}</span>
        <span className="text-zinc-600 text-xs">Updates as you log meals</span>
      </div>
    </div>
  );
}
