"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock, RefreshCw, Loader2, PlayCircle, ExternalLink } from "lucide-react";
import { Meal } from "@/types";

export function MealDetailModal({
  meal,
  swapping,
  onClose,
  onSwap,
}: {
  meal: Meal | null;
  swapping: boolean;
  onClose: () => void;
  onSwap: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [meal?.name]);

  return (
    <AnimatePresence>
      {meal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-white/[0.1] rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto"
          >
            {meal.image && !imgError && (
              <div className="relative w-full h-48 shrink-0">
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-full object-cover rounded-t-3xl"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent rounded-t-3xl" />
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{meal.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{meal.description}</p>
                </div>
                {(!meal.image || imgError) && (
                  <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {(meal.videoUrl || meal.sourceUrl) && (
                <div className="flex gap-2">
                  {meal.videoUrl && (
                    <a
                      href={meal.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-400 py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-500/15 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Watch video
                    </a>
                  )}
                  {meal.sourceUrl && (
                    <a
                      href={meal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.1] text-zinc-400 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Source
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: meal.calories, unit: "kcal", color: "text-orange-400" },
                  { val: meal.protein, unit: "P", color: "text-blue-400" },
                  { val: meal.carbs, unit: "C", color: "text-amber-400" },
                  { val: meal.fat, unit: "F", color: "text-rose-400" },
                ].map((m, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-xl py-2 flex flex-col items-center gap-0.5">
                    <span className={`text-[10px] font-bold ${m.color}`}>{m.unit}</span>
                    <span className="text-sm font-bold text-zinc-100">{m.val}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                <Clock className="w-3.5 h-3.5" />
                {meal.prepTime} min
              </div>

              {meal.ingredients?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Ingredients</p>
                  <ul className="space-y-1.5">
                    {meal.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {meal.instructions && meal.instructions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Steps</p>
                  <ol className="space-y-2">
                    {meal.instructions.map((step, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-3">
                        <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                onClick={onSwap}
                disabled={swapping}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.1] text-zinc-200 py-3 rounded-2xl font-semibold text-sm hover:bg-white/[0.09] transition-colors disabled:opacity-60"
              >
                {swapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {swapping ? "Finding a new meal…" : "Swap this meal"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
