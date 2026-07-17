"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  { delay: 0,    type: "cmd",     text: "sattvic analyze --dosha vata" },
  { delay: 800,  type: "muted",   text: "→ scanning body constitution..." },
  { delay: 1500, type: "success", text: "✓ dosha identified: Vata (68%)" },
  { delay: 2200, type: "muted",   text: "→ building personalized plan..." },
  { delay: 3000, type: "success", text: "✓ breakfast: Warm Oat Porridge  320 kcal" },
  { delay: 3600, type: "success", text: "✓ lunch:     Dal Khichdi        480 kcal" },
  { delay: 4200, type: "success", text: "✓ dinner:    Palak Paneer       410 kcal" },
  { delay: 5000, type: "muted",   text: "→ calculating macros..." },
  { delay: 5600, type: "data",    text: "  protein  72g  ████████░░  89%" },
  { delay: 6000, type: "data",    text: "  carbs    180g ██████████  100%" },
  { delay: 6400, type: "data",    text: "  fat      52g  ███████░░░  74%" },
  { delay: 7000, type: "score",   text: "✦ Sattvic Score: 87 / 100  Grade A" },
];

const colorMap: Record<string, string> = {
  cmd:     "text-white font-semibold",
  muted:   "text-zinc-500",
  success: "text-emerald-400",
  data:    "text-sky-300 font-mono text-xs",
  score:   "text-amber-300 font-bold",
};

export function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    LINES.forEach((line, i) => {
      const t = setTimeout(() => setVisibleLines((prev) => [...prev, i]), line.delay);
      return () => clearTimeout(t);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* glow */}
      <div className="absolute -inset-6 bg-emerald-500/10 rounded-[2.5rem] blur-3xl pointer-events-none" />

      {/* terminal window */}
      <div className="dark-panel relative bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

        {/* title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-zinc-500 text-xs font-mono ml-2">sattvic — meal planner</span>
        </div>

        {/* body */}
        <div className="p-5 font-mono text-sm space-y-1.5 min-h-[280px]">
          <AnimatePresence>
            {LINES.map((line, i) =>
              visibleLines.includes(i) ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`leading-relaxed ${colorMap[line.type]}`}
                >
                  {line.type === "cmd" && (
                    <span className="text-emerald-500 mr-2">$</span>
                  )}
                  {line.text}
                  {i === visibleLines[visibleLines.length - 1] && (
                    <span className={`inline-block ml-0.5 w-1.5 h-4 bg-emerald-400 align-middle ${cursor ? "opacity-100" : "opacity-0"} transition-opacity`} />
                  )}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {visibleLines.length === 0 && (
            <div className="text-zinc-600">
              <span className="text-emerald-500 mr-2">$</span>
              <span className={`inline-block w-1.5 h-4 bg-emerald-400 align-middle ${cursor ? "opacity-100" : "opacity-0"} transition-opacity`} />
            </div>
          )}
        </div>

        {/* bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none" />
      </div>

      {/* floating metric badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visibleLines.length >= 10 ? 1 : 0, y: visibleLines.length >= 10 ? 0 : 10 }}
        transition={{ duration: 0.4 }}
        className="absolute -right-4 top-20 bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-emerald-900/40"
      >
        +12 streak 🔥
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visibleLines.length >= 12 ? 1 : 0, y: visibleLines.length >= 12 ? 0 : 10 }}
        transition={{ duration: 0.4 }}
        className="absolute -left-4 bottom-16 bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-amber-900/40"
      >
        Grade A ✦
      </motion.div>
    </div>
  );
}
