"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, RotateCcw, Check, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

/* ── Dosha questions (single select) ─────────────────── */
const questions = [
  {
    id: "body",
    question: "How would you describe your body frame?",
    options: [
      { label: "Thin & light, hard to gain weight", value: "vata" },
      { label: "Medium, muscular, gain & lose easily", value: "pitta" },
      { label: "Larger frame, gain weight easily", value: "kapha" },
    ],
  },
  {
    id: "mind",
    question: "How is your mind typically?",
    options: [
      { label: "Quick, creative, easily distracted", value: "vata" },
      { label: "Sharp, focused, driven, sometimes intense", value: "pitta" },
      { label: "Calm, steady, slow to learn but never forgets", value: "kapha" },
    ],
  },
  {
    id: "hunger",
    question: "How is your hunger and digestion?",
    options: [
      { label: "Irregular — sometimes hungry, sometimes not", value: "vata" },
      { label: "Strong hunger, irritable if meals are skipped", value: "pitta" },
      { label: "Low appetite, can easily skip meals", value: "kapha" },
    ],
  },
  {
    id: "sleep",
    question: "How do you sleep?",
    options: [
      { label: "Light sleeper, vivid dreams, hard to fall asleep", value: "vata" },
      { label: "Moderate — fall asleep easily, wake sharp", value: "pitta" },
      { label: "Deep, heavy sleeper, hard to wake up", value: "kapha" },
    ],
  },
  {
    id: "stress",
    question: "Under stress, you tend to...",
    options: [
      { label: "Worry, feel anxious, overthink", value: "vata" },
      { label: "Get irritable, frustrated, or angry", value: "pitta" },
      { label: "Withdraw, feel sluggish, emotional eat", value: "kapha" },
    ],
  },
  {
    id: "temperature",
    question: "How do you relate to temperature?",
    options: [
      { label: "Always cold — I need layers others don't", value: "vata" },
      { label: "Run warm — I overheat easily, sweat more", value: "pitta" },
      { label: "Moderate — I feel cold and damp, not hot", value: "kapha" },
    ],
  },
  {
    id: "energy",
    question: "How would you describe your daily energy?",
    options: [
      { label: "Bursts of high energy then sudden crash", value: "vata" },
      { label: "Sustained and intense — I push through", value: "pitta" },
      { label: "Low but steady — slow to start, slow to tire", value: "kapha" },
    ],
  },
];

/* ── Multi-select steps ───────────────────────────────── */
const ALLERGY_OPTIONS = [
  { id: "nuts",     label: "Tree nuts & peanuts",   emoji: "🥜" },
  { id: "dairy",    label: "Dairy / lactose",        emoji: "🥛" },
  { id: "gluten",   label: "Gluten / wheat",          emoji: "🌾" },
  { id: "soy",      label: "Soy",                     emoji: "🫘" },
  { id: "eggs",     label: "Eggs",                    emoji: "🥚" },
  { id: "sesame",   label: "Sesame seeds",            emoji: "🌱" },
  { id: "legumes",  label: "Legumes / lentils",       emoji: "🫛" },
  { id: "none",     label: "No allergies",            emoji: "✅" },
];

const CONDITION_OPTIONS = [
  { id: "diabetes",          label: "Diabetes / pre-diabetes",   emoji: "🩸" },
  { id: "thyroid",           label: "Thyroid (hypo/hyper)",      emoji: "🦋" },
  { id: "pcos",              label: "PCOS",                      emoji: "🔄" },
  { id: "high blood pressure", label: "High blood pressure",     emoji: "❤️" },
  { id: "high cholesterol",  label: "High cholesterol",          emoji: "⚡" },
  { id: "ibs",               label: "IBS / digestive issues",    emoji: "🫄" },
  { id: "anemia",            label: "Anaemia / iron deficiency", emoji: "🔴" },
  { id: "celiac",            label: "Celiac disease",            emoji: "🌾" },
  { id: "kidney",            label: "Kidney disease",            emoji: "🫘" },
  { id: "none",              label: "None of the above",         emoji: "✅" },
];

/* ── Types ────────────────────────────────────────────── */
type DoshaResult = {
  dosha: string;
  percentage: { vata: number; pitta: number; kapha: number };
  description: string;
  qualities: string[];
  nutritionPrinciples: string[];
  bestFoods: string[];
  avoidFoods: string[];
  mealTiming: string;
  color: string;
  conditionNotes?: string;
};

const doshaColors: Record<string, { bg: string; text: string; border: string; badge: string; ring: string }> = {
  Vata:  { bg: "bg-violet-900/30",  text: "text-violet-300",  border: "border-violet-700/40", badge: "bg-violet-500",  ring: "#7c3aed" },
  Pitta: { bg: "bg-rose-900/30",    text: "text-rose-300",    border: "border-rose-700/40",   badge: "bg-rose-500",    ring: "#e11d48" },
  Kapha: { bg: "bg-emerald-900/30", text: "text-emerald-300", border: "border-emerald-700/40",badge: "bg-emerald-500", ring: "#059669" },
};
const doshaEmoji: Record<string, string> = { Vata: "🌬️", Pitta: "🔥", Kapha: "🌿" };

// Total steps: 5 dosha + 2 health = 7
const TOTAL_STEPS = questions.length + 2;
const ALLERGY_STEP = questions.length + 1;   // step 6
const CONDITION_STEP = questions.length + 2; // step 7

/* ── Science accordion shown on intro page ────────────── */
const SCIENCE_QA = [
  {
    q: "Is Ayurveda scientifically proven?",
    a: "Not in the clinical sense. Ayurveda is a 5,000-year-old traditional system, not a peer-reviewed framework. There are no large randomised controlled trials that prove 'Vata people must eat warm food.' It is a constitutional typology — similar in structure to modern metabolic typing — that has been refined through millennia of observation.",
  },
  {
    q: "Then why do the quiz questions make sense?",
    a: "Because they map to real, observable physiology. Body frame and weight-gain pattern reflect metabolic rate. Hunger regularity correlates with gastric motility and enzyme activity. Sleep depth tracks nervous system arousal. Stress response (anxious vs. angry vs. withdrawn) reflects your autonomic nervous system baseline. These are genuine biological patterns — Ayurveda just grouped and named them centuries before we had the labs to measure them.",
  },
  {
    q: "Do the food recommendations actually work?",
    a: "The principles have real basis. Thin people with irregular digestion (Vata) genuinely do better on easy-to-digest, calorie-dense, warm cooked food. People who run hot and intense (Pitta) benefit from anti-inflammatory cooling foods and suffer more from spicy food. Slow-metabolism, heavier-set people (Kapha) respond well to light, fibre-rich, spiced food. These overlap meaningfully with modern nutritional science — just wrapped in a different language.",
  },
  {
    q: "Should I trust my dosha result blindly?",
    a: "No. Think of it as a starting hypothesis, not a life sentence. SATTVIC uses your dosha to prioritise meal suggestions — meals aligned with your dosha appear first and get a badge. But every meal in the plan is nutritionally complete regardless of dosha. If a recommendation feels wrong for your body, ignore it. You know your body better than any quiz.",
  },
];

function ScienceAccordion() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  return (
    <div className="border border-white/[0.08] rounded-3xl overflow-hidden">
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/[0.03] transition-colors text-left"
      >
        <HelpCircle className="w-5 h-5 text-zinc-500 shrink-0" />
        <span className="flex-1 text-sm font-semibold text-zinc-400">Is this scientifically grounded? What is Ayurveda?</span>
        {panelOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
      </button>
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="p-4 space-y-2">
              {SCIENCE_QA.map((item, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.06]">
                  <button
                    onClick={() => setOpenItem(openItem === i ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <span className="flex-1 text-sm font-medium text-zinc-300">{item.q}</span>
                    {openItem === i ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {openItem === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-zinc-500 leading-relaxed border-t border-white/[0.05] pt-3">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DoshaPage() {
  return (
    <Suspense fallback={null}>
      <DoshaQuiz />
    </Suspense>
  );
}

function DoshaQuiz() {
  const searchParams = useSearchParams();
  const inJourney = searchParams.get("journey") === "1";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [result, setResult] = useState<DoshaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");

  const currentQ = questions[step - 1];
  const progress = step === 0 ? 0 : (step / TOTAL_STEPS) * 100;

  function toggleMulti(
    id: string,
    list: string[],
    setList: (v: string[]) => void,
    exclusive = "none"
  ) {
    if (id === exclusive) {
      setList(list.includes(exclusive) ? [] : [exclusive]);
      return;
    }
    const without = list.filter((x) => x !== exclusive);
    setList(without.includes(id) ? without.filter((x) => x !== id) : [...without, id]);
  }

  async function submitAll() {
    setLoading(true);
    setApiError("");
    try {
      const customItems = customAllergy.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const allAllergies = [...allergies.filter((a) => a !== "none"), ...customItems];
      const res = await fetch("/api/ai/dosha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          allergies: allAllergies,
          conditions: conditions.filter((c) => c !== "none"),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.dosha) throw new Error(data.error ?? "Invalid response");
      setResult(data);
      setStep(TOTAL_STEPS + 1);
      localStorage.setItem("sattvic-dosha", data.dosha);
      localStorage.setItem("sattvic-allergies", JSON.stringify(allAllergies));
      localStorage.setItem("sattvic-conditions", JSON.stringify(conditions.filter((c) => c !== "none")));
    } catch (err: any) {
      setApiError(
        err.message?.includes("credit")
          ? "API credits needed — add $5 at console.anthropic.com."
          : "Something went wrong. Please try again."
      );
      setStep(TOTAL_STEPS);
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step >= 1 && step <= questions.length) {
      if (!selected) return;
      setAnswers((prev) => ({ ...prev, [currentQ.id]: selected }));
      setSelected(null);
      setStep((s) => s + 1);
    } else if (step === ALLERGY_STEP) {
      setStep((s) => s + 1);
    } else if (step === CONDITION_STEP) {
      submitAll();
    }
  }

  function handleBack() {
    if (step > 1 && step <= questions.length) {
      setStep((s) => s - 1);
      setSelected(answers[questions[step - 2].id] ?? null);
    } else {
      setStep((s) => s - 1);
      setSelected(null);
    }
  }

  function reset() {
    setStep(0); setAnswers({}); setResult(null);
    setSelected(null); setAllergies([]); setCustomAllergy(""); setConditions([]);
  }

  const colors = result ? (doshaColors[result.dosha] ?? doshaColors.Vata) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* progress bar */}
        {step > 0 && step <= TOTAL_STEPS && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium">
              <span>Step {step} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── INTRO ─────────────────────────── */}
          {step === 0 && (
            <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="space-y-12">
              <div className="text-center space-y-4">
                <p className="text-xs font-bold tracking-widest text-emerald-500 uppercase">5,000 year old science · modern nutrition</p>
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                  Your body has a type.<br />
                  <span className="text-emerald-400 italic">Most diets ignore it.</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
                  Ayurveda — the world's oldest nutritional system — says every person has a dominant <strong className="text-zinc-200">dosha</strong>: a mind-body constitution that determines what foods energise you, which ones drain you, and when to eat for peak performance.
                </p>
                <p className="text-zinc-500 text-base max-w-lg mx-auto">
                  That's why two people can eat the exact same "healthy" diet and get completely different results. Generic meal plans don't work because <em className="text-zinc-300">you aren't generic.</em>
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-center text-sm font-bold uppercase tracking-widest text-zinc-500">The three doshas explained</h2>

                {/* Vata */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-violet-900/20 border border-violet-700/30 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">🌬️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-violet-300">Vata</h3>
                        <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-semibold">Air & Space</span>
                      </div>
                      <p className="text-violet-400 font-medium">The Creative. The Dreamer. The Overthinker.</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">Vata types are naturally thin, energetic, and creative — but their energy comes in bursts. They get cold easily, have irregular digestion, and their minds race at night making sleep difficult.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-violet-900/20 border border-violet-700/20 rounded-2xl p-3 space-y-1">
                      <p className="text-xs font-bold text-violet-400 uppercase tracking-wide">You thrive on</p>
                      <p className="text-sm text-zinc-300">Warm, cooked, oily foods. Ghee, nuts, root vegetables, dairy, hearty soups.</p>
                    </div>
                    <div className="bg-violet-900/20 border border-violet-700/20 rounded-2xl p-3 space-y-1">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">Avoid</p>
                      <p className="text-sm text-zinc-300">Raw salads, cold smoothies, dry crackers, excess caffeine.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Pitta */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-rose-900/20 border border-rose-700/30 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">🔥</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-rose-300">Pitta</h3>
                        <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">Fire & Water</span>
                      </div>
                      <p className="text-rose-400 font-medium">The Leader. The Achiever. The Perfectionist.</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">Pitta types are medium-built, sharp-minded, and intensely driven. They have strong digestion, run warm, and get genuinely irritable when they miss meals.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-rose-900/20 border border-rose-700/20 rounded-2xl p-3 space-y-1">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">You thrive on</p>
                      <p className="text-sm text-zinc-300">Cooling, bitter, sweet foods. Coconut, cucumber, leafy greens, lentils, sweet fruits.</p>
                    </div>
                    <div className="bg-rose-900/20 border border-rose-700/20 rounded-2xl p-3 space-y-1">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">Avoid</p>
                      <p className="text-sm text-zinc-300">Spicy food, fermented foods, alcohol, excessive caffeine.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Kapha */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-emerald-900/20 border border-emerald-700/30 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">🌿</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-emerald-300">Kapha</h3>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">Earth & Water</span>
                      </div>
                      <p className="text-emerald-400 font-medium">The Nurturer. The Loyalist. The Rock.</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">Kapha types are naturally larger-framed, calm, and deeply loyal. They have the best endurance but gain weight easily and can struggle with motivation.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-900/20 border border-emerald-700/20 rounded-2xl p-3 space-y-1">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">You thrive on</p>
                      <p className="text-sm text-zinc-300">Light, warm, spiced foods. Lentils, leafy greens, ginger, turmeric, beans.</p>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-700/20 rounded-2xl p-3 space-y-1">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">Avoid</p>
                      <p className="text-sm text-zinc-300">Heavy dairy, fried food, excessive sweets, cold food.</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-7 space-y-3">
                <h3 className="text-xl font-bold text-white">Why does this matter for what you eat?</h3>
                <p className="text-zinc-400 leading-relaxed">A Vata eating cold raw salads every day is working against their body. A Kapha eating heavy curries every meal is adding fuel to an already slow fire. A Pitta eating spicy food under stress is literally inflaming themselves.</p>
                <p className="text-zinc-500 leading-relaxed">SATTVIC uses your dosha — plus your allergies and health conditions — to give you a plan that's calibrated to <em className="text-zinc-300">your</em> body, not a generic average.</p>
              </div>

              <ScienceAccordion />

              <div className="text-center space-y-3">
                <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/30">
                  Find my Dosha <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-zinc-600">7 questions · Takes about 2 minutes · Free forever</p>
              </div>
            </motion.div>
          )}

          {/* ── DOSHA QUESTIONS ───────────────── */}
          {step >= 1 && step <= questions.length && !loading && (
            <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }} className="space-y-8">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Dosha question {step} of {questions.length}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">{currentQ.question}</h2>
              </div>
              <div className="space-y-3">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelected(opt.value)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 font-medium flex items-center gap-3 ${
                      selected === opt.value
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-white/[0.1] bg-[#141414] text-zinc-300 hover:border-white/25"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected === opt.value ? "border-emerald-500 bg-emerald-500" : "border-white/20"}`}>
                      {selected === opt.value && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
              {apiError && <div className="bg-rose-900/20 border border-rose-700/30 text-rose-300 text-sm rounded-2xl px-4 py-3">⚠️ {apiError}</div>}
              <div className="flex gap-3">
                {step > 1 && (
                  <button onClick={handleBack} className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] text-zinc-400 hover:bg-white/[0.06] transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button onClick={handleNext} disabled={!selected} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-400 transition-colors disabled:opacity-30">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ALLERGIES ─────────────────────── */}
          {step === ALLERGY_STEP && !loading && (
            <motion.div key="allergies" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }} className="space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Health profile · Step 1 of 2</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">Do you have any food allergies or intolerances?</h2>
                <p className="text-zinc-500 text-sm">Select all that apply. Your meal recommendations will exclude these ingredients completely.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ALLERGY_OPTIONS.map((opt) => {
                  const active = allergies.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleMulti(opt.id, allergies, setAllergies)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        active
                          ? "border-amber-500 bg-amber-500/10 text-white"
                          : "border-white/[0.1] bg-[#141414] text-zinc-300 hover:border-white/25"
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{opt.label}</p>
                      </div>
                      {active && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom allergy input */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Anything else?</p>
                <div className="relative">
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    placeholder="e.g. avocado, mustard, kiwi (comma separated)"
                    className="w-full bg-[#141414] border border-white/[0.1] rounded-2xl px-4 py-3.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                  {customAllergy && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customAllergy.split(",").map((s) => s.trim()).filter(Boolean).map((item) => (
                        <span key={item} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleBack} className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] text-zinc-400 hover:bg-white/[0.06] transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-400 transition-colors">
                  {allergies.length === 0 && !customAllergy.trim() ? "Skip" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── CONDITIONS ────────────────────── */}
          {step === CONDITION_STEP && !loading && (
            <motion.div key="conditions" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }} className="space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest">Health profile · Step 2 of 2</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">Any health conditions we should know about?</h2>
                <p className="text-zinc-500 text-sm">Your nutrition plan will be tailored to keep these conditions in mind. Select all that apply.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CONDITION_OPTIONS.map((opt) => {
                  const active = conditions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleMulti(opt.id, conditions, setConditions)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        active
                          ? "border-sky-500 bg-sky-500/10 text-white"
                          : "border-white/[0.1] bg-[#141414] text-zinc-300 hover:border-white/25"
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{opt.label}</p>
                      </div>
                      {active && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {apiError && <div className="bg-rose-900/20 border border-rose-700/30 text-rose-300 text-sm rounded-2xl px-4 py-3">⚠️ {apiError}</div>}
              <div className="flex gap-3">
                <button onClick={handleBack} className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] text-zinc-400 hover:bg-white/[0.06] transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-400 transition-colors">
                  {conditions.length === 0 ? "Skip & See Results" : "See My Results"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── LOADING ───────────────────────── */}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
              <p className="text-zinc-300 font-medium">Analysing your constitution…</p>
              <p className="text-zinc-500 text-sm">Personalising for your health profile 🌿</p>
            </motion.div>
          )}

          {/* ── RESULT ────────────────────────── */}
          {step === TOTAL_STEPS + 1 && result && !loading && colors && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">

              {/* header */}
              <div className={`${colors.bg} ${colors.border} border rounded-3xl p-8 text-center space-y-3`}>
                <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Your Dominant Dosha</p>
                <div className="text-7xl">{doshaEmoji[result.dosha]}</div>
                <h2 className={`text-5xl font-black tracking-tight ${colors.text}`}>{result.dosha}</h2>
                <p className="text-zinc-400 leading-relaxed max-w-md mx-auto">{result.description}</p>
                <div className="mt-4 space-y-2 text-left max-w-xs mx-auto">
                  {(["vata", "pitta", "kapha"] as const).map((d) => (
                    <div key={d} className="space-y-0.5">
                      <div className="flex justify-between text-xs font-medium text-zinc-500">
                        <span className="capitalize">{d}</span>
                        <span>{result.percentage[d]}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={colors.badge}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.percentage[d]}%` }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                          style={{ height: "100%", borderRadius: "9999px", opacity: d === result.dosha.toLowerCase() ? 1 : 0.35 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* science disclaimer */}
              <div className="flex gap-3 items-start bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
                <HelpCircle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <span className="text-zinc-400 font-semibold">About this result — </span>
                  Dosha typing comes from Ayurveda, India's 5,000-year nutritional tradition. It is not a clinical diagnosis. Think of it as a constitutional pattern — a grouping of metabolism, digestion, and temperament traits that commonly appear together. The food recommendations it generates are grounded in real principles (e.g. warm foods for slow digestion, cooling foods for inflammatory tendencies) even though the framework itself predates clinical nutrition science. SATTVIC uses your dosha to <em>prioritise</em> meal suggestions, not restrict them.
                </p>
              </div>

              {/* condition note */}
              {result.conditionNotes && (
                <div className="flex gap-3 bg-sky-900/20 border border-sky-700/30 rounded-2xl px-5 py-4">
                  <span className="text-xl shrink-0">🩺</span>
                  <p className="text-sm text-sky-300 leading-relaxed">{result.conditionNotes}</p>
                </div>
              )}

              {/* qualities */}
              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Your Qualities</p>
                <div className="flex flex-wrap gap-2">
                  {result.qualities.map((q) => (
                    <span key={q} className={`${colors.bg} ${colors.text} ${colors.border} border px-3 py-1.5 rounded-full text-sm font-medium`}>{q}</span>
                  ))}
                </div>
              </div>

              {/* nutrition principles */}
              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Nutrition Principles for You</p>
                {result.nutritionPrinciples.map((p, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className={`w-5 h-5 rounded-full ${colors.badge} text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5`}>{i + 1}</span>
                    <p className="text-zinc-300 text-sm leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>

              {/* best & avoid foods */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-3">✅ Eat More</p>
                  <ul className="space-y-1.5">
                    {result.bestFoods.map((f) => (
                      <li key={f} className="text-sm text-zinc-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3">⚠️ Limit</p>
                  <ul className="space-y-1.5">
                    {result.avoidFoods.map((f) => (
                      <li key={f} className="text-sm text-zinc-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* meal timing */}
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">⏰ Meal Timing for {result.dosha}</p>
                <p className="text-zinc-300 leading-relaxed text-sm">{result.mealTiming}</p>
              </div>

              {inJourney && (
                <Link
                  href="/macros?journey=1"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-2xl hover:bg-emerald-400 transition-colors font-semibold"
                >
                  Next: Calculate your macros <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button onClick={reset} className="w-full flex items-center justify-center gap-2 border border-white/[0.1] text-zinc-400 py-3 rounded-2xl hover:bg-white/[0.06] transition-colors font-medium">
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
