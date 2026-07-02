"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ArrowRight, Flame, Clock, ChevronDown, ChevronUp, Zap } from "lucide-react";

const QUICK_CRAVINGS = [
  { label: "Pizza 🍕", query: "pizza" },
  { label: "Burger 🍔", query: "burger" },
  { label: "Pasta 🍝", query: "pasta" },
  { label: "Fries 🍟", query: "french fries" },
  { label: "Chocolate Cake 🎂", query: "chocolate cake" },
  { label: "Ice Cream 🍦", query: "ice cream" },
  { label: "Nachos 🫔", query: "nachos" },
  { label: "Mac & Cheese 🧀", query: "mac and cheese" },
  { label: "Cheesecake 🍰", query: "cheesecake" },
  { label: "Fried Rice 🍚", query: "fried rice" },
  { label: "Donuts 🍩", query: "donuts" },
  { label: "Waffles 🧇", query: "waffles" },
];

type JunkResult = {
  name: string;
  tagline: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  calories: number;
  originalCalories: number;
  macros: { protein: number; carbs: number; fat: number; fibre: number };
  keySwaps: { original: string; swap: string; why: string }[];
  ingredients: string[];
  steps: string[];
  healthScore: number;
  tags: string[];
};

export default function JunkPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<JunkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  async function search(craving: string) {
    if (!craving.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setShowSteps(false);

    try {
      const res = await fetch("/api/ai/junk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ craving: craving.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message?.includes("credit")
        ? "API credits needed — add $5 at console.anthropic.com."
        : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const calorieSaving = result ? result.originalCalories - result.calories : 0;
  const savingPercent = result ? Math.round((calorieSaving / result.originalCalories) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium px-4 py-2 rounded-full">
            <Flame className="w-3.5 h-3.5" /> Guilt-Free Junk Food
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Craving something?<br />
            <span className="text-rose-400 italic">We've got you.</span>
          </h1>
          <p className="text-zinc-500 max-w-md mx-auto">
            Type any junk food you're craving. We'll make you a vegetarian version that actually tastes good — with significantly fewer calories and way better ingredients.
          </p>
        </motion.div>

        {/* search */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(query)}
              placeholder="e.g. pizza, pasta, chocolate brownie, biryani..."
              className="w-full pl-12 pr-28 py-4 bg-[#141414] border border-white/[0.1] rounded-2xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 text-base transition-colors"
            />
            <button
              onClick={() => search(query)}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-rose-400 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Make it healthy</>}
            </button>
          </div>

          {/* quick craving chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_CRAVINGS.map((c) => (
              <button
                key={c.query}
                onClick={() => { setQuery(c.query); search(c.query); }}
                className="text-sm px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-zinc-400 rounded-xl hover:border-rose-500/40 hover:text-rose-300 hover:bg-rose-500/5 transition-all"
              >
                {c.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* error */}
        {error && (
          <div className="bg-rose-900/20 border border-rose-700/30 text-rose-300 text-sm rounded-2xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        {/* loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3">
            <div className="text-5xl animate-bounce">🍕</div>
            <p className="text-zinc-300 font-medium">Cooking up a healthier version…</p>
            <p className="text-zinc-600 text-sm">Finding the perfect swaps</p>
          </motion.div>
        )}

        {/* result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              {/* hero card */}
              <div className="relative bg-gradient-to-br from-rose-900/30 to-orange-900/20 border border-rose-700/30 rounded-3xl p-7 space-y-4 overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                    Health Score {result.healthScore}/100
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white pr-24">{result.name}</h2>
                  <p className="text-rose-300 text-sm font-medium">{result.tagline}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {result.tags.map((t) => (
                    <span key={t} className="text-xs bg-white/[0.07] border border-white/[0.1] text-zinc-400 px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>

                {/* calorie savings banner */}
                <div className="flex items-center gap-4 bg-black/20 rounded-2xl p-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{result.calories}</p>
                    <p className="text-xs text-zinc-500">kcal / serving</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-emerald-400 text-sm font-bold">↓ {calorieSaving} kcal saved</div>
                    <div className="text-xs text-zinc-500">{savingPercent}% fewer than original</div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-zinc-500 line-through">{result.originalCalories}</p>
                    <p className="text-xs text-zinc-600">original</p>
                  </div>
                </div>

                {/* macros */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Protein", value: `${result.macros.protein}g`, color: "text-emerald-400" },
                    { label: "Carbs",   value: `${result.macros.carbs}g`,   color: "text-amber-400" },
                    { label: "Fat",     value: `${result.macros.fat}g`,     color: "text-rose-400" },
                    { label: "Fibre",   value: `${result.macros.fibre}g`,   color: "text-sky-400" },
                  ].map((m) => (
                    <div key={m.label} className="bg-black/20 rounded-xl p-3 text-center">
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-zinc-600">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* time */}
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Prep {result.prepTime}</span>
                  <span className="flex items-center gap-1.5"><Flame className="w-4 h-4" /> Cook {result.cookTime}</span>
                  <span>Serves {result.servings}</span>
                </div>
              </div>

              {/* key swaps */}
              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-lg">🔄 Smart Swaps</h3>
                <p className="text-zinc-500 text-sm">What we changed — and why it works</p>
                <div className="space-y-3">
                  {result.keySwaps.map((s, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex items-center gap-2 shrink-0 min-w-0">
                        <span className="text-xs text-zinc-500 line-through truncate max-w-[90px]">{s.original}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-400 truncate max-w-[90px]">{s.swap}</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">— {s.why}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ingredients */}
              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-lg">🛒 Ingredients</h3>
                <div className="grid grid-cols-2 gap-2">
                  {result.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {ing}
                    </div>
                  ))}
                </div>
              </div>

              {/* steps — collapsible */}
              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl overflow-hidden">
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className="font-bold text-white text-lg">👨‍🍳 Step-by-Step Instructions</h3>
                  {showSteps ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </button>
                <AnimatePresence>
                  {showSteps && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 space-y-4">
                        {result.steps.map((s, i) => (
                          <div key={i} className="flex gap-4 items-start">
                            <span className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-zinc-300 text-sm leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* try another */}
              <button
                onClick={() => { setResult(null); setQuery(""); }}
                className="w-full py-3 rounded-2xl border border-white/[0.1] text-zinc-400 hover:bg-white/[0.04] transition-colors font-medium text-sm"
              >
                Try another craving →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
