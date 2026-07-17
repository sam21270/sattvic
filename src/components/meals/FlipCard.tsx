"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Dumbbell, Zap, Wheat, X } from "lucide-react";
import { Meal } from "@/types";

export function FlipCard({ meal }: { meal: Meal }) {
  const [flipped, setFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);

  const VIRAL_TAGS = ["TikTok Viral", "TikTok", "TikTok 2024", "Reddit Viral", "Reddit Favourite", "Instagram Viral", "NYT Cooking", "YouTube Classic"];
  const viralTag = meal.tags.find((t) => VIRAL_TAGS.includes(t));

  const tagGradients: Record<string, string> = {
    Indian:        "from-orange-900/60 to-amber-900/40",
    Asian:         "from-red-900/60 to-rose-900/40",
    Mediterranean: "from-sky-900/60 to-blue-900/40",
    Fresh:         "from-emerald-900/60 to-teal-900/40",
    Italian:       "from-green-900/60 to-emerald-900/40",
    Breakfast:     "from-yellow-900/60 to-orange-900/40",
    "Meal Prep":   "from-violet-900/60 to-purple-900/40",
    Korean:        "from-rose-900/60 to-pink-900/40",
    Japanese:      "from-sky-900/60 to-indigo-900/40",
    default:       "from-zinc-800/60 to-zinc-900/40",
  };
  const gradientKey = meal.tags[0] ?? "default";
  const gradient = tagGradients[gradientKey] ?? tagGradients.default;

  return (
    <div
      className="relative cursor-pointer"
      style={{ perspective: 1200, height: 430 }}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: "preserve-3d", position: "relative", width: "100%", height: "100%" }}
      >

        {/* ── FRONT ─────────────────────────── */}
        <div
          className="absolute inset-0 bg-[#141414] rounded-3xl border border-white/[0.07] overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* image area */}
          <div className="relative w-full h-48 overflow-hidden">
            {meal.image && !imgError ? (
              <>
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
                {/* subtle gradient overlay so text sits over image on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/60 via-transparent to-transparent" />
              </>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-6xl opacity-60">
                  {meal.tags[0] === "Indian" ? "🍛"
                    : meal.tags[0] === "Asian" ? "🥢"
                    : meal.tags[0] === "Breakfast" ? "🍳"
                    : meal.tags[0] === "Italian" ? "🍝"
                    : meal.tags[0] === "Fresh" ? "🥗"
                    : "🌿"}
                </span>
              </div>
            )}

            {/* viral source badge — bottom left */}
            {viralTag && (
              <div className="absolute bottom-3 left-3">
                {/* pinned on a photo: keep the dark pill + light text in both
                    themes, so use a literal hex the light-mode remap skips */}
                <span className="text-[10px] bg-black/70 backdrop-blur-sm text-[#6ee7b7] border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                  🔥 {viralTag}
                </span>
              </div>
            )}
            {/* protein / carb badges — top right */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {meal.isHighProtein && (
                <span className="text-[10px] bg-blue-700/95 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-bold shadow">
                  High Protein
                </span>
              )}
              {meal.isLowCarb && (
                <span className="text-[10px] bg-amber-700/95 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-bold shadow">
                  Low Carb
                </span>
              )}
            </div>
          </div>

          {/* card body */}
          <div className="p-5 space-y-3">
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{meal.name}</h3>
              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{meal.description}</p>
            </div>

            {/* macro grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: meal.calories, unit: "kcal", color: "text-orange-400" },
                { val: meal.protein,  unit: "P",    color: "text-blue-400" },
                { val: meal.carbs,    unit: "C",    color: "text-amber-400" },
                { val: meal.fat,      unit: "F",    color: "text-rose-400" },
              ].map((m, i) => (
                <div key={i} className="bg-white/[0.04] rounded-xl py-2 flex flex-col items-center gap-0.5">
                  <span className={`text-[10px] font-bold ${m.color}`}>{m.unit}</span>
                  <span className="text-sm font-bold text-zinc-100">{m.val}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="w-3 h-3" />
                {meal.prepTime} min
              </div>
              <span className="text-xs text-emerald-500 font-semibold">Tap to see recipe →</span>
            </div>
          </div>
        </div>

        {/* ── BACK ──────────────────────────── */}
        <div
          className="absolute inset-0 bg-[#0f0f0f] rounded-3xl p-6 flex flex-col border border-white/[0.07]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{meal.name}</h3>
              <div className="flex gap-1.5 mt-1.5">
                {meal.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-white/[0.07] text-zinc-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              className="text-zinc-600 hover:text-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto space-y-4 pr-1 scrollbar-thin">
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
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.06] text-xs text-zinc-400">
            <span>{meal.calories} kcal</span>
            <span className="text-zinc-700">·</span>
            <span>{meal.protein}g protein</span>
            <span className="text-zinc-700">·</span>
            <span>{meal.prepTime} min</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
