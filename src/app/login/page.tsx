"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowLeft, Leaf, Sparkles } from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { BorderBeam } from "@/components/ui/BorderBeam";

/* ─── Perks ────────────────────── */
const perks = [
  { emoji: "📊", text: "Your Sattvic Score synced across devices", color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  { emoji: "🔥", text: "Daily streaks with a shield for missed days", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  { emoji: "🏅", text: "Achievement badges as you hit milestones", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)" },
  { emoji: "🌿", text: "Dosha result saved to your profile", color: "#a78bfa", bg: "rgba(167,139,250,0.10)" },
];

export default function LoginPage() {
  return (
    <div className="noise relative min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* ambient background — matches homepage hero */}
      <FloatingOrbs />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* logo + heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-2 rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Welcome back
          </motion.div>

          <div className="flex justify-center">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/50">
              <Leaf className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            Sign in to <span className="text-emerald-400 italic">SATTVIC</span>
          </h1>
          <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Track your Sattvic Score, streaks, and badges across all your devices.
          </p>
        </motion.div>

        {/* card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <BorderBeam duration={5} colorFrom="#10b981" colorTo="#8b5cf6" />
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-violet-500 to-transparent" />

          <div className="p-8 space-y-6 backdrop-blur-xl">
            {/* what you get */}
            <div className="space-y-3">
              {perks.map((perk, i) => (
                <motion.div
                  key={perk.text}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-base shrink-0"
                    style={{ background: perk.bg, border: `1px solid ${perk.color}33` }}
                  >
                    {perk.emoji}
                  </span>
                  <span className="text-sm text-zinc-300 leading-snug">{perk.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-white/[0.07]" />

            {/* Google sign in */}
            <motion.button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 py-3.5 rounded-2xl font-semibold cursor-pointer hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] transition-colors duration-200 shadow-lg shadow-black/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>

            <p className="text-center text-xs text-zinc-600">
              Free forever · No credit card needed
            </p>
          </div>
        </motion.div>

        {/* back to home */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="text-center"
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
