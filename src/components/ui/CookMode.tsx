"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

// Full-screen step-by-step cooking view: big text, one step at a time.
export function CookMode({ name, steps, onClose }: { name: string; steps: string[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0a0a0a] flex flex-col" data-lenis-prevent>
      {/* header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Cooking</p>
          <h2 className="text-lg font-bold text-white">{name}</h2>
        </div>
        <button onClick={onClose} aria-label="Close cook mode" className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* progress dots */}
      <div className="flex gap-1.5 px-6 py-4">
        {steps.map((_, d) => (
          <div key={d} className={`h-1.5 flex-1 rounded-full transition-colors ${d <= i ? "bg-emerald-500" : "bg-white/[0.08]"}`} />
        ))}
      </div>

      {/* the step */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-2xl text-center space-y-6">
          <p className="text-emerald-500 font-bold text-lg">Step {i + 1} of {steps.length}</p>
          <p className="text-white text-2xl sm:text-3xl font-semibold leading-relaxed">{steps[i]}</p>
        </div>
      </div>

      {/* nav */}
      <div className="flex gap-3 px-6 pb-8 max-w-2xl w-full mx-auto">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.06] text-zinc-300 font-bold disabled:opacity-30 hover:bg-white/[0.1] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={() => (last ? onClose() : setI((v) => v + 1))}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg transition-colors"
        >
          {last ? <><Check className="w-5 h-5" /> Done — enjoy!</> : <>Next <ChevronRight className="w-5 h-5" /></>}
        </button>
      </div>
    </div>
  );
}
