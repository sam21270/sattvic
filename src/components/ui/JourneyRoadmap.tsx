"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ─── Mini UI Previews ─────────────────────────────────────────── */

function QuizPreview() {
  return (
    <div className="dark-panel bg-[#111] border border-white/[0.08] rounded-b-2xl p-5 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500 font-medium">Step 2 of 7</span>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i <= 2 ? "bg-violet-500 w-5" : "bg-white/10 w-3"}`} />
          ))}
        </div>
      </div>
      <p className="text-sm font-bold text-white">How&apos;s your energy in the morning?</p>
      <div className="space-y-2">
        {[
          { label: "Scattered, need a warm-up", active: false },
          { label: "Sharp & ready to go 🔥", active: true },
          { label: "Slow and steady", active: false },
        ].map((opt) => (
          <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium ${opt.active ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "bg-white/[0.03] border-white/[0.07] text-zinc-400"}`}>
            <div className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${opt.active ? "border-violet-400 bg-violet-500" : "border-white/20"}`}>
              {opt.active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            {opt.label}
          </div>
        ))}
      </div>
      <div className="h-9 bg-violet-500 rounded-xl flex items-center justify-center text-xs font-bold text-white">Next →</div>
    </div>
  );
}

function MacrosPreview() {
  return (
    <div className="dark-panel bg-[#111] border border-white/[0.08] rounded-b-2xl p-5 select-none">
      <p className="text-[11px] text-zinc-500 mb-4 font-medium">Your daily targets</p>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="40" cy="40" r="30" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`} strokeDashoffset={`${2 * Math.PI * 30 * 0.28}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white">1800</span>
            <span className="text-[8px] text-zinc-500">kcal</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {[
            { label: "Protein", val: 75, color: "bg-blue-400" },
            { label: "Carbs",   val: 55, color: "bg-amber-400" },
            { label: "Fat",     val: 40, color: "bg-rose-400" },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-zinc-500">{m.label}</span>
                <span className="text-zinc-300 font-semibold">{m.val}g</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[{ e: "⚡", l: "2,400 kcal" }, { e: "💪", l: "120g protein" }, { e: "🔥", l: "Grade A" }].map((s) => (
          <div key={s.l} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 text-center">
            <div className="text-base">{s.e}</div>
            <div className="text-[9px] text-zinc-500 mt-0.5 leading-tight">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealPlannerPreview() {
  return (
    <div className="dark-panel bg-[#111] border border-white/[0.08] rounded-b-2xl p-5 select-none">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-white">Monday · AI Generated</p>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">1,360 kcal</span>
      </div>
      <div className="space-y-2">
        {[
          { time: "Breakfast", name: "Masala Oats", kcal: 320, tag: "🥣" },
          { time: "Lunch",     name: "Paneer Tikka Bowl", kcal: 480, tag: "🫕" },
          { time: "Dinner",    name: "Dal Makhani + Rice", kcal: 560, tag: "🍲" },
        ].map((m) => (
          <div key={m.time} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-xl">{m.tag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{m.name}</p>
              <p className="text-[10px] text-zinc-600">{m.time}</p>
            </div>
            <span className="text-[10px] text-zinc-500 shrink-0">{m.kcal} kcal</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
        <span className="text-[11px] text-emerald-400 font-semibold">✦ Regenerate week</span>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="dark-panel bg-[#111] border border-white/[0.08] rounded-b-2xl p-5 select-none space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * 0.22}`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-emerald-400">78</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-zinc-500">Sattvic Score</p>
          <p className="text-lg font-black text-white">Grade B+</p>
          <p className="text-[10px] text-zinc-600">3 meals logged today</p>
        </div>
        <div className="text-3xl">🔥</div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Calories", pct: 72, color: "#f97316" },
          { label: "Protein",  pct: 89, color: "#3b82f6" },
          { label: "Water",    pct: 60, color: "#38bdf8" },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 w-12 shrink-0">{b.label}</span>
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
            <span className="text-[10px] text-zinc-500 w-6 text-right">{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JunkPreview() {
  return (
    <div className="dark-panel bg-[#111] border border-white/[0.08] rounded-b-2xl p-5 select-none space-y-4">
      <div>
        <p className="text-[10px] text-zinc-500 mb-2 font-medium uppercase tracking-widest">I&apos;m craving…</p>
        <div className="flex flex-wrap gap-1.5">
          {["🍕 Pizza", "🍔 Burger", "🍜 Noodles", "🌮 Tacos"].map((c) => (
            <span key={c} className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium ${c.startsWith("🍕") ? "bg-rose-500/20 border-rose-500/40 text-rose-300" : "bg-white/[0.04] border-white/[0.08] text-zinc-400"}`}>{c}</span>
          ))}
        </div>
      </div>
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <p className="text-xs font-black text-white mb-1">🥬 Cauliflower Crust Pizza</p>
        <p className="text-[10px] text-zinc-400 mb-2">Same satisfaction · 420 fewer calories</p>
        <div className="flex gap-4">
          {[{ l: "Cal", v: "280" }, { l: "Protein", v: "18g" }, { l: "Carbs", v: "32g" }].map((s) => (
            <div key={s.l}>
              <p className="text-xs font-bold text-emerald-400">{s.v}</p>
              <p className="text-[9px] text-zinc-600">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialPreview() {
  return (
    <div className="dark-panel bg-[#111] border border-white/[0.08] rounded-b-2xl p-5 select-none space-y-2">
      <p className="text-xs font-bold text-white mb-3">This week&apos;s leaderboard</p>
      {[
        { emoji: "🧘", name: "priya_eats", score: 840, crown: true },
        { emoji: "⚡", name: "arjun_fit",  score: 720 },
        { emoji: "🌿", name: "meera.well", score: 655 },
        { emoji: "🔥", name: "you",        score: 610, isMe: true },
      ].map((u, i) => (
        <div key={u.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs ${u.isMe ? "bg-emerald-500/10 border-emerald-500/25" : "bg-white/[0.02] border-white/[0.05]"}`}>
          <span className="w-5 text-center font-bold text-zinc-500">{u.crown ? "👑" : `#${i+1}`}</span>
          <span className="text-base">{u.emoji}</span>
          <span className={`flex-1 font-semibold ${u.isMe ? "text-emerald-400" : "text-zinc-300"}`}>@{u.name}{u.isMe && " · you"}</span>
          <span className={`font-black ${u.crown ? "text-amber-400" : "text-zinc-400"}`}>{u.score}</span>
        </div>
      ))}
      <div className="mt-2 h-7 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
        <span className="text-[10px] text-violet-400 font-semibold">Challenge friends · Earn badges</span>
      </div>
    </div>
  );
}

/* ─── Steps Data ───────────────────────────────────────────────── */

const STEPS = [
  {
    num: "01", emoji: "🌿",
    label: "Discover your Dosha",
    desc: "Take a 7-question Ayurvedic quiz to find out if you're Vata, Pitta, or Kapha. Your result unlocks a nutrition plan tailored to your body type, energy, and digestion.",
    href: "/dosha", cta: "Take the quiz",
    accent: "#8b5cf6", accentInk: "var(--ink-8b5cf6)", accentMuted: "rgba(139,92,246,0.12)", accentBorder: "rgba(139,92,246,0.25)",
    Preview: QuizPreview,
  },
  {
    num: "02", emoji: "🧮",
    label: "Calculate your macros",
    desc: "Enter your stats and goal — lose fat, build muscle, or maintain. Get your exact daily calorie, protein, carb and fat targets calculated instantly.",
    href: "/macros", cta: "Set my targets",
    accent: "#10b981", accentInk: "var(--ink-10b981)", accentMuted: "rgba(16,185,129,0.10)", accentBorder: "rgba(16,185,129,0.25)",
    Preview: MacrosPreview,
  },
  {
    num: "03", emoji: "🗓️",
    label: "Generate your meal plan",
    desc: "One click fills your full week with balanced vegetarian meals — breakfast, lunch and dinner — perfectly matched to your macro targets. Regenerate any day.",
    href: "/meal-planner", cta: "Plan my week",
    accent: "#f59e0b", accentInk: "var(--ink-f59e0b)", accentMuted: "rgba(245,158,11,0.10)", accentBorder: "rgba(245,158,11,0.25)",
    Preview: MealPlannerPreview,
  },
  {
    num: "04", emoji: "📊",
    label: "Track daily & earn your score",
    desc: "Log meals, watch your Sattvic Score update live, track water intake, workouts, and activity rings. Maintain streaks to unlock badges and climb the leaderboard.",
    href: "/dashboard", cta: "Open dashboard",
    accent: "#38bdf8", accentInk: "var(--ink-38bdf8)", accentMuted: "rgba(56,189,248,0.10)", accentBorder: "rgba(56,189,248,0.25)",
    Preview: DashboardPreview,
  },
  {
    num: "05", emoji: "🍕",
    label: "Satisfy cravings — the healthy way",
    desc: "Got a craving? Type it in. Get an Ayurvedic vegetarian version that hits the same spot with a fraction of the calories. No guilt, full flavour.",
    href: "/junk", cta: "Try Healthy Junk",
    accent: "#f43f5e", accentInk: "var(--ink-f43f5e)", accentMuted: "rgba(244,63,94,0.10)", accentBorder: "rgba(244,63,94,0.25)",
    Preview: JunkPreview,
  },
  {
    num: "06", emoji: "🏆",
    label: "Compete with friends",
    desc: "Create your profile, add friends, and compare weekly scores on the leaderboard. Take on challenges, earn bonus points, and keep each other accountable.",
    href: "/social", cta: "Go social",
    accent: "#a78bfa", accentInk: "var(--ink-a78bfa)", accentMuted: "rgba(167,139,250,0.10)", accentBorder: "rgba(167,139,250,0.25)",
    Preview: SocialPreview,
  },
];

/* ─── Browser Shell ────────────────────────────────────────────── */

function BrowserShell({ href, accent, children }: { href: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `0 24px 80px -12px ${accent}25` }}>
      {/* title bar */}
      <div className="dark-panel-bar bg-[#1c1c1c] border border-white/[0.08] border-b-0 rounded-t-2xl px-4 py-2.5 flex items-center gap-2.5">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 h-5 bg-white/[0.05] rounded-md mx-1 flex items-center px-2 min-w-0">
          <span className="text-[10px] text-zinc-600 truncate">sattvic.app{href}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Single Step ──────────────────────────────────────────────── */

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const flip = index % 2 !== 0; // odd indexes: preview left, text right
  const Preview = step.Preview;

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">

      {/* Text column */}
      <motion.div
        initial={{ opacity: 0, x: flip ? 32 : -32 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`space-y-5 ${flip ? "md:order-2" : "md:order-1"}`}
      >
        {/* step number */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
            style={{ background: step.accentMuted, color: step.accentInk, border: `1px solid ${step.accentBorder}` }}
          >
            {step.num}
          </div>
          <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${step.accent}50, transparent)` }} />
        </div>

        <div>
          <div className="text-4xl mb-3">{step.emoji}</div>
          <h3 className="text-2xl md:text-[1.75rem] font-black text-white leading-tight">{step.label}</h3>
        </div>

        <p className="text-zinc-400 leading-relaxed">{step.desc}</p>

        <Link
          href={step.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm group transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: step.accentMuted, color: step.accentInk, border: `1px solid ${step.accentBorder}` }}
        >
          {step.cta}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Preview column */}
      <motion.div
        initial={{ opacity: 0, x: flip ? -32 : 32, scale: 0.97 }}
        animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={`${flip ? "md:order-1" : "md:order-2"}`}
      >
        <BrowserShell href={step.href} accent={step.accent}>
          <Preview />
        </BrowserShell>
      </motion.div>

    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */

export function JourneyRoadmap() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-20 space-y-4"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-500 uppercase bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
            Your journey
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Six steps to your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-violet-400">
              best self.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            SATTVIC is a full wellness system. Here&apos;s how each piece connects — from your first quiz to daily habit.
          </p>
        </motion.div>

        {/* Steps — separated by a subtle divider + connector dot */}
        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div key={step.num}>
              <StepCard step={step} index={i} />
              {/* connector between steps */}
              {i < STEPS.length - 1 && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-px h-10 bg-gradient-to-b from-white/[0.08] to-white/[0.02]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-px h-10 bg-gradient-to-b from-white/[0.02] to-white/[0.08]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 text-center space-y-3"
        >
          <p className="text-zinc-500 text-sm">Ready to start? The quiz takes 2 minutes.</p>
          <Link
            href="/dosha"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-900/30 hover:-translate-y-0.5"
          >
            🌿 Start with your Dosha quiz
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
