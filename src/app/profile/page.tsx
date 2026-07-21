"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Flame, Trophy, Star, Shield } from "lucide-react";
import { ALL_BADGES, getBadge, computeLocalBadges } from "@/lib/badges";
import { loadHistory, currentStreak } from "@/lib/scoring";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}`)
        .then((r) => r.json())
        .then(setUserData);
    }
  }, [session]);

  if (status === "loading" || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = session!.user as any;
  // DB badges ∪ badges evaluated from local activity (the DB isn't synced yet)
  const earnedBadges: string[] = Array.from(new Set([...(userData.badges ?? []), ...computeLocalBadges()]));
  const scoreHistory: any[] = userData.scoreHistory ?? [];
  const doshaResult = userData.doshaResult;

  // Derive streak + avg score from the SAME local history the dashboard uses,
  // so the two pages agree. Falls back to the DB value if there's no local data.
  // ponytail: swap to the synced DB fields once localStorage→Mongo sync lands.
  const history = loadHistory();
  const streak = history.length ? currentStreak(history) : (userData.streak ?? 0);
  const avgScore = history.length
    ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length)
    : (userData.totalScore ?? 0);

  const doshaColors: Record<string, string> = {
    Vata:  "bg-violet-50 border-violet-200 text-violet-700",
    Pitta: "bg-rose-50 border-rose-200 text-rose-700",
    Kapha: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  const doshaEmoji: Record<string, string> = { Vata: "🌬️", Pitta: "🔥", Kapha: "🌿" };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      {/* profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] border border-white/[0.07] rounded-3xl p-7 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
                {user.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-zinc-600 text-sm">{user.email}</p>
              {doshaResult && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border mt-2 ${doshaColors[doshaResult.dosha] ?? ""}`}>
                  {doshaEmoji[doshaResult.dosha]} {doshaResult.dosha} type
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-rose-600 transition-colors border border-white/[0.1] px-4 py-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </motion.div>

      {/* stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Flame,   label: "Current Streak",  value: `${streak} days`,   color: "text-orange-500", bg: "bg-orange-50" },
          { icon: Star,    label: "Avg Sattvic Score",value: `${avgScore} / 100`,              color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Trophy,  label: "Badges Earned",   value: `${earnedBadges.length} / ${ALL_BADGES.length}`, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#141414] border border-white/[0.07] rounded-3xl p-5 shadow-sm text-center space-y-2"
          >
            <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center mx-auto`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-600 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* streak shield */}
      {(userData.streakShield ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-white/[0.06] text-white rounded-2xl px-5 py-4"
        >
          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Streak Shield active</p>
            <p className="text-zinc-600 text-xs">You have {userData.streakShield} shield{userData.streakShield > 1 ? "s" : ""}. Miss a day and your streak is protected automatically.</p>
          </div>
        </motion.div>
      )}

      {/* score history mini chart */}
      {scoreHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 shadow-sm space-y-4"
        >
          <h2 className="font-bold text-zinc-100 text-lg">Score History</h2>
          <div className="flex items-end gap-2 h-20">
            {scoreHistory.slice(0, 14).reverse().map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h.score}%` }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  className="w-full rounded-t-lg"
                  style={{
                    backgroundColor: h.score >= 75 ? "#10b981" : h.score >= 55 ? "#f59e0b" : "#f97316",
                    minHeight: 4,
                  }}
                />
                <span className="text-[9px] text-zinc-600">{h.grade}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600">Last {Math.min(scoreHistory.length, 14)} days</p>
        </motion.div>
      )}

      {/* badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 shadow-sm space-y-5"
      >
        <h2 className="font-bold text-zinc-100 text-lg">
          Badges <span className="text-zinc-600 font-normal text-sm ml-1">{earnedBadges.length}/{ALL_BADGES.length} earned</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_BADGES.map((badge) => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  earned ? badge.color : "bg-white/[0.03] border-white/[0.07] opacity-40 grayscale"
                }`}
              >
                <span className="text-2xl shrink-0">{badge.emoji}</span>
                <div>
                  <p className="text-xs font-bold leading-tight">{badge.name}</p>
                  <p className="text-[10px] opacity-75 leading-tight mt-0.5">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
