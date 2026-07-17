"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Segment {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  textColor: string;
}

interface MacroRingProps {
  calories: number;
  calorieTarget: number;
  segments: Segment[];
}

const SIZE = 220;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function MacroRing({ calories, calorieTarget, segments }: MacroRingProps) {
  const [animated, setAnimated] = useState(false);
  const pct = Math.min((calories || 0) / (calorieTarget || 1), 1);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  // build arc segments
  // guard against 0/0 → NaN when nothing is logged yet
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = CIRC * 0.25; // start at top

  return (
    <div className="flex flex-col md:flex-row items-center gap-10">
      {/* SVG ring */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="#f0ede8" strokeWidth={STROKE}
          />
          {/* segments */}
          {segments.map((seg, i) => {
            const segLen = (seg.value / total) * CIRC * pct;
            const gap = 4;
            const el = (
              <motion.circle
                key={i}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${animated ? Math.max(segLen - gap, 0) : 0} ${CIRC}`}
                strokeDashoffset={-offset}
                transition={{ duration: 1.2, delay: 0.1 * i, ease: "easeOut" }}
                initial={{ strokeDasharray: `0 ${CIRC}` }}
                animate={{ strokeDasharray: `${Math.max(segLen - gap, 0)} ${CIRC}` }}
              />
            );
            offset += segLen;
            return el;
          })}
        </svg>
        {/* centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-4xl font-bold text-white leading-none"
          >
            {calories}
          </motion.p>
          <p className="text-xs text-zinc-600 font-medium mt-1">of {calorieTarget} kcal</p>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            {Math.round(pct * 100)}%
          </p>
        </div>
      </div>

      {/* legend */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {segments.map((seg) => (
          <div key={seg.label} className={`rounded-2xl p-4 ${seg.bgColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{seg.label}</span>
            </div>
            <p className={`text-2xl font-bold ${seg.textColor}`}>{seg.value}<span className="text-sm font-normal ml-0.5">g</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
