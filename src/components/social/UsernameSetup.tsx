"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, Loader2 } from "lucide-react";

const AVATAR_EMOJIS = [
  "🧘","🌿","💪","🥗","🔥","⚡","🌟","🦋",
  "🧠","🎯","🌸","🏆","🦁","🐉","🌙","✨",
];

const DOSHA_EMOJIS: Record<string, string> = { Vata: "🌬️", Pitta: "🔥", Kapha: "🌊" };

interface Props {
  onComplete: (username: string) => void;
}

export function UsernameSetup({ onComplete }: Props) {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("🧘");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1=username, 2=avatar+bio

  const usernameValid = /^[a-z0-9_]{3,20}$/.test(username.toLowerCase());

  async function handleSubmit() {
    if (!usernameValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/social/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio, avatarEmoji: avatar, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onComplete(username);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#141414] border border-white/[0.1] rounded-3xl p-8 shadow-2xl"
      >
        {/* header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-5xl mb-4"
          >
            {avatar}
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-1">Set up your profile</h2>
          <p className="text-zinc-500 text-sm">Choose a username to compete with friends</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* username */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block font-medium">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">@</span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setError(""); }}
                    maxLength={20}
                    className="w-full pl-8 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white font-semibold text-lg placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                  />
                  {username.length >= 3 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {usernameValid
                        ? <Check className="w-4 h-4 text-emerald-400" />
                        : <X className="w-4 h-4 text-rose-400" />
                      }
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600 mt-1.5">3–20 chars · letters, numbers, underscores</p>
                {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
              </div>

              <button
                disabled={!usernameValid}
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
              >
                Next — Choose avatar →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* avatar grid */}
              <div>
                <label className="text-xs text-zinc-500 mb-3 block font-medium">Pick your avatar</label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setAvatar(e)}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        avatar === e
                          ? "bg-emerald-500/25 ring-2 ring-emerald-500 scale-110"
                          : "hover:bg-white/[0.07]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* bio */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block font-medium">Bio <span className="text-zinc-700">(optional)</span></label>
                <textarea
                  placeholder="Vata trying to find balance 🌿"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={80}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 resize-none transition-colors"
                />
                <p className="text-[10px] text-zinc-700 text-right mt-0.5">{bio.length}/80</p>
              </div>

              {/* visibility */}
              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                <div>
                  <p className="text-sm font-semibold text-white">Public profile</p>
                  <p className="text-xs text-zinc-500">Others can find and add you</p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? "bg-emerald-500" : "bg-zinc-700"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${isPublic ? "left-6" : "left-0.5"}`} />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-none px-5 py-3.5 bg-white/[0.05] text-zinc-400 font-semibold rounded-2xl hover:bg-white/[0.09] transition-colors"
                >
                  ← Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Saving…" : "Let's go! 🚀"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
