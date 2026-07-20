"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, X, Play } from "lucide-react";
import { Meal } from "@/types";

// Where to watch the recipe: a real sourceUrl/videoUrl wins; otherwise send the
// user to a search on the platform it came from (its viral tag), which always
// resolves to the actual clip as the top result. No dead links to maintain.
function watchLink(meal: Meal): { url: string; label: string } {
  if (meal.sourceUrl) return { url: meal.sourceUrl, label: "Watch the original →" };
  if (meal.videoUrl) return { url: meal.videoUrl, label: "Watch the video →" };
  const q = encodeURIComponent(`${meal.name} recipe`);
  const tags = meal.tags.join(" ").toLowerCase();
  if (tags.includes("tiktok")) return { url: `https://www.tiktok.com/search?q=${q}`, label: "Watch on TikTok →" };
  if (tags.includes("instagram")) return { url: `https://www.instagram.com/explore/search/keyword/?q=${q}`, label: "Find on Instagram →" };
  if (tags.includes("reddit")) return { url: `https://www.reddit.com/search/?q=${q}`, label: "Find on Reddit →" };
  return { url: `https://www.youtube.com/results?search_query=${q}`, label: "Watch on YouTube →" };
}

export function FlipCard({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const VIRAL_TAGS = ["TikTok Viral", "TikTok", "TikTok 2024", "Reddit Viral", "Reddit Favourite", "Instagram Viral", "NYT Cooking", "YouTube Classic"];
  const viralTag = meal.tags.find((t) => VIRAL_TAGS.includes(t));
  const watch = watchLink(meal);

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
  const gradient = tagGradients[meal.tags[0] ?? "default"] ?? tagGradients.default;

  const foodEmoji = meal.tags[0] === "Indian" ? "🍛"
    : meal.tags[0] === "Asian" ? "🥢"
    : meal.tags[0] === "Breakfast" ? "🍳"
    : meal.tags[0] === "Italian" ? "🍝"
    : meal.tags[0] === "Fresh" ? "🥗"
    : "🌿";

  return (
    <>
      {/* ── CARD ─────────────────────────── */}
      <div
        className="bg-[#141414] rounded-3xl border border-white/[0.07] overflow-hidden cursor-pointer hover:border-white/[0.15] transition-colors"
        onClick={() => setOpen(true)}
      >
        <div className="relative w-full h-48 overflow-hidden">
          {meal.image && !imgError ? (
            <>
              <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-6xl opacity-60">{foodEmoji}</span>
            </div>
          )}

          {viralTag && (
            <div className="absolute bottom-3 left-3">
              <span className="text-[10px] bg-black/70 backdrop-blur-sm text-[#6ee7b7] border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                🔥 {viralTag}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {meal.isHighProtein && <span className="text-[10px] bg-blue-700/95 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-bold shadow">High Protein</span>}
            {meal.isLowCarb && <span className="text-[10px] bg-amber-700/95 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-bold shadow">Low Carb</span>}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{meal.name}</h3>
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{meal.description}</p>
          </div>

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

      {/* ── DETAIL MODAL — native scroll, room for the watch link ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-[#141414] w-full sm:max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-white/[0.1] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="flex items-start justify-between gap-3 p-6 pb-3 shrink-0">
                <div>
                  <h3 className="font-bold text-white text-xl leading-tight">{meal.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meal.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-white/[0.07] text-zinc-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 space-y-5">
                <p className="text-sm text-zinc-400">{meal.description}</p>

                {meal.ingredients?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Ingredients</p>
                    <ul className="space-y-1.5">
                      {meal.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {meal.instructions && meal.instructions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Method</p>
                    <ol className="space-y-2.5">
                      {meal.instructions.map((step, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-3">
                          <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* footer: macros + watch link */}
              <div className="shrink-0 p-6 pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex gap-3 text-xs text-zinc-400">
                  <span>{meal.calories} kcal</span><span className="text-zinc-700">·</span>
                  <span>{meal.protein}g protein</span><span className="text-zinc-700">·</span>
                  <span>{meal.prepTime} min</span>
                </div>
                <a
                  href={watch.url} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" /> {watch.label}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
