"use client";

import { motion } from "framer-motion";

interface Ring {
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}

interface Props {
  steps: number;
  calories: number;
  activeMinutes: number;
  stepsGoal?: number;
  caloriesGoal?: number;
  minutesGoal?: number;
}

export function ActivityRings({
  steps,
  calories,
  activeMinutes,
  stepsGoal = 10000,
  caloriesGoal = 500,
  minutesGoal = 30,
}: Props) {
  const rings: Ring[] = [
    { label: "Move", value: calories, max: caloriesGoal, color: "#ef4444", unit: "kcal" },
    { label: "Exercise", value: activeMinutes, max: minutesGoal, color: "#10b981", unit: "min" },
    { label: "Steps", value: steps, max: stepsGoal, color: "#3b82f6", unit: "" },
  ];

  const size = 160;
  const strokeWidth = 14;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {rings.map((ring, i) => {
            const gap = 10;
            const r = center - strokeWidth / 2 - i * (strokeWidth + gap);
            const circumference = 2 * Math.PI * r;
            const pct = Math.min((ring.value || 0) / (ring.max || 1), 1);
            const dash = pct * circumference;
            return (
              <g key={ring.label}>
                {/* track */}
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  opacity={0.12}
                />
                {/* progress */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - dash }}
                  transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
                />
              </g>
            );
          })}
        </svg>

        {/* center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{(steps / 1000).toFixed(1)}k</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest">steps</span>
        </div>
      </div>

      {/* legend */}
      <div className="flex gap-4">
        {rings.map((ring) => (
          <div key={ring.label} className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: ring.color }} />
              <span className="text-[11px] text-zinc-400">{ring.label}</span>
            </div>
            <span className="text-sm font-bold text-white">
              {ring.value.toLocaleString()}{ring.unit && <span className="text-[10px] text-zinc-500 ml-0.5">{ring.unit}</span>}
            </span>
            <span className="text-[10px] text-zinc-600">/ {ring.max.toLocaleString()}{ring.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
