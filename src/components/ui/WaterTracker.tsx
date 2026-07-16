"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  current: number;
  goal?: number;
  onAdd: (amount: number) => void;
}

export function WaterTracker({ current, goal = 2500, onAdd }: Props) {
  const pct = Math.min(current / goal, 1);
  const [ripple, setRipple] = useState(false);

  function handleAdd(amount: number) {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    onAdd(amount);
  }

  const levels = [250, 500, 750];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* bottle svg */}
      <div className="relative w-20 h-32">
        <svg viewBox="0 0 80 128" className="absolute inset-0 w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* bottle body */}
          <rect x="10" y="20" width="60" height="98" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {/* neck */}
          <rect x="28" y="8" width="24" height="14" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {/* cap */}
          <rect x="26" y="2" width="28" height="8" rx="3" fill="#38bdf8" opacity="0.7" />

          {/* water fill — clip to bottle body */}
          <clipPath id="bottle-clip">
            <rect x="10" y="20" width="60" height="98" rx="12" />
          </clipPath>

          <g clipPath="url(#bottle-clip)">
            {/* wave background */}
            {/* full-height rect scaled from the bottle's bottom via CSS —
                SVG geometry attributes don't animate reliably, transforms do */}
            <rect
              x="10"
              y="20"
              width="60"
              height="98"
              fill="url(#water-grad)"
              style={{
                transform: `scaleY(${pct})`,
                transformOrigin: "40px 118px",
                transition: "transform 0.6s ease-in-out",
              }}
            />

            {/* ripple */}
            <AnimatePresence>
              {ripple && (
                <motion.ellipse
                  key="ripple"
                  cx="40"
                  cy={20 + (1 - pct) * 98}
                  rx="20"
                  ry="5"
                  fill="rgba(255,255,255,0.3)"
                  initial={{ scaleX: 0.2, opacity: 0.8 }}
                  animate={{ scaleX: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>
          </g>

          <defs>
            <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>

        {/* percentage overlay */}
        <div className="absolute inset-0 flex items-center justify-center pt-6">
          <span className="text-xs font-bold text-white drop-shadow-lg">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      {/* stats */}
      <div className="text-center">
        <div className="text-lg font-black text-white">{current} <span className="text-sm text-zinc-400 font-normal">ml</span></div>
        <div className="text-xs text-zinc-500">of {goal} ml goal</div>
      </div>

      {/* quick add buttons */}
      <div className="flex gap-2">
        {levels.map((ml) => (
          <button
            key={ml}
            onClick={() => handleAdd(ml)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/20 hover:bg-sky-500/25 transition-colors"
          >
            +{ml}ml
          </button>
        ))}
      </div>

      {/* remove buttons — for mis-taps */}
      {current > 0 && (
        <div className="flex gap-2">
          {levels.map((ml) => (
            <button
              key={ml}
              onClick={() => onAdd(-Math.min(ml, current))}
              disabled={current <= 0}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] text-zinc-500 border border-white/[0.08] hover:text-rose-300 hover:border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              −{ml}ml
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
