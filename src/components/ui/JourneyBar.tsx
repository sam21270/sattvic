"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

// Macros is the foundation (targets drive planning + tracking). The Dosha quiz
// is an optional add-on, so it sits last and is skippable.
const STEPS = [
  { path: "/macros", label: "Macros" },
  { path: "/meal-planner", label: "Meal Plan" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dosha", label: "Dosha (optional)" },
];

function JourneyBarInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const active = searchParams.get("journey") === "1";

  if (!active) return null;

  const currentIndex = STEPS.findIndex((s) => s.path === pathname);

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/[0.07]"
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, i) => {
          const done = currentIndex > -1 && i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.path} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                    done
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500"
                      : "bg-white/[0.06] text-zinc-600 border border-white/[0.08]"
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${isCurrent ? "text-zinc-100" : done ? "text-zinc-400" : "text-zinc-600"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-5 sm:w-10 h-px ${done ? "bg-emerald-500/50" : "bg-white/[0.08]"}`} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function JourneyBar() {
  return (
    <Suspense fallback={null}>
      <JourneyBarInner />
    </Suspense>
  );
}
