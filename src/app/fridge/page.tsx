"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Plus, Sparkles, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";

interface FridgeMeal {
  name: string;
  description: string;
  emoji: string;
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  usesFrom: string[];
  extraNeeded: string[];
  instructions: string[];
}

const SUGGESTIONS = ["Paneer", "Eggs", "Spinach", "Tomatoes", "Onion", "Lentils", "Chickpeas", "Tofu", "Broccoli", "Yogurt", "Rice", "Quinoa"];

export default function FridgePage() {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);

  useEffect(() => {
    try { setIngredients(JSON.parse(localStorage.getItem("sattvic-fridge") ?? "[]")); } catch {}
  }, []);

  // persist fridge contents — the shopping list cross-references them
  // (skip the very first run so the empty initial state doesn't clobber storage)
  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) { loaded.current = true; return; }
    localStorage.setItem("sattvic-fridge", JSON.stringify(ingredients));
  }, [ingredients]);
  const [results, setResults] = useState<FridgeMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState("");

  function addIngredient(item?: string) {
    const val = (item ?? input).trim();
    if (!val || ingredients.includes(val)) return;
    setIngredients((p) => [...p, val]);
    setInput("");
  }

  function removeIngredient(item: string) {
    setIngredients((p) => p.filter((i) => i !== item));
  }

  async function handleGenerate() {
    if (ingredients.length < 2) { setError("Add at least 2 ingredients."); return; }
    setError("");
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/ai/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredients.join(", "), jain: localStorage.getItem("sattvic-jain") === "1" }),
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message?.includes("credit")
        ? "API credits needed — add $5 at console.anthropic.com to enable this feature."
        : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

      {/* header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <p className="text-xs font-semibold tracking-widest text-emerald-600 uppercase">What's In My Fridge?</p>
        <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
          Tell me what you have.<br />I'll tell you what to cook.
        </h1>
        <p className="text-zinc-500">
          Add the ingredients sitting in your fridge right now. Get 3 vegetarian meals you can make today — no shopping needed.
        </p>
      </motion.div>

      {/* input area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
            placeholder="Type an ingredient and press Enter…"
            className="flex-1 border border-white/[0.1] bg-[#141414] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          <button
            onClick={() => addIngredient()}
            disabled={!input.trim()}
            className="bg-white/[0.06] text-white px-4 py-3 rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-40"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* quick suggestions */}
        <div>
          <p className="text-xs text-zinc-600 mb-2 font-medium">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.filter((s) => !ingredients.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addIngredient(s)}
                className="text-xs bg-[#141414] border border-white/[0.1] text-zinc-400 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* ingredient chips */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-[#141414] border border-white/[0.07] rounded-2xl shadow-sm">
            {ingredients.map((item) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium px-3 py-1.5 rounded-full"
              >
                {item}
                <button onClick={() => removeIngredient(item)} className="hover:text-rose-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/25 px-4 py-2 rounded-xl">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading || ingredients.length < 2}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.06] text-white py-4 rounded-2xl font-bold text-base hover:bg-emerald-600 transition-colors disabled:opacity-40"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Finding meals…</>
            : <><Sparkles className="w-5 h-5" /> What can I make?</>
          }
        </button>
      </motion.div>

      {/* results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-xs font-semibold tracking-widest text-zinc-600 uppercase">
              3 meals you can make right now
            </p>
            {results.map((meal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#141414] border border-white/[0.07] rounded-3xl overflow-hidden shadow-sm"
              >
                {/* card top */}
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full text-left p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{meal.emoji}</span>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{meal.name}</h3>
                        <p className="text-zinc-500 text-sm mt-0.5">{meal.description}</p>
                      </div>
                    </div>
                    {expanded === i
                      ? <ChevronUp className="w-5 h-5 text-zinc-600 shrink-0 mt-1" />
                      : <ChevronDown className="w-5 h-5 text-zinc-600 shrink-0 mt-1" />
                    }
                  </div>

                  {/* macro row */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <Clock className="w-3.5 h-3.5" /> {meal.prepTime} min
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-500 font-semibold">
                      <Zap className="w-3.5 h-3.5" /> {meal.calories} kcal
                    </span>
                    <span className="text-blue-600 font-semibold">{meal.protein}g protein</span>
                    <span className="text-amber-600 font-semibold">{meal.carbs}g carbs</span>
                  </div>

                  {/* uses from fridge */}
                  <div className="flex flex-wrap gap-1.5">
                    {meal.usesFrom.map((f) => (
                      <span key={f} className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                        ✓ {f}
                      </span>
                    ))}
                    {meal.extraNeeded.map((f) => (
                      <span key={f} className="text-xs bg-white/[0.03] text-zinc-500 border border-white/[0.1] px-2 py-0.5 rounded-full">
                        + {f}
                      </span>
                    ))}
                  </div>
                </button>

                {/* expanded instructions */}
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-white/[0.07]">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mt-4 mb-3">How to make it</p>
                        <ol className="space-y-2.5">
                          {meal.instructions.map((step, j) => (
                            <li key={j} className="flex gap-3 text-sm text-zinc-200">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{j + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
