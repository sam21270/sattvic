"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { UserPlus, Check, ArrowLeft, Trophy, Flame, Star, Calendar } from "lucide-react";
import { StreakFire } from "@/components/ui/StreakFire";

interface PublicProfile {
  id: string;
  username: string;
  name: string;
  avatarEmoji: string;
  bio: string;
  dosha: string | null;
  totalScore: number;
  weeklyScore: number;
  streak: number;
  badges: string[];
  scoreHistory: { date: string; score: number; grade: string }[];
  memberSince: string;
}

const DOSHA_INFO: Record<string, { color: string; desc: string; emoji: string }> = {
  Vata: { color: "from-violet-500/20 to-indigo-500/10 border-violet-500/30 text-violet-300", desc: "Creative · Energetic · Quick", emoji: "🌬️" },
  Pitta: { color: "from-rose-500/20 to-orange-500/10 border-rose-500/30 text-rose-300",       desc: "Focused · Ambitious · Fiery",  emoji: "🔥" },
  Kapha: { color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300", desc: "Grounded · Steady · Nurturing", emoji: "🌊" },
};

const BADGE_META: Record<string, { emoji: string; name: string }> = {
  first_log:     { emoji: "🌱", name: "First Log" },
  streak_3:      { emoji: "🔥", name: "3-Day Streak" },
  streak_7:      { emoji: "⚡", name: "Week Warrior" },
  streak_30:     { emoji: "💎", name: "Iron Streak" },
  perfect_score: { emoji: "✨", name: "Perfect Score" },
  protein_king:  { emoji: "💪", name: "Protein King" },
  macro_master:  { emoji: "🎯", name: "Macro Master" },
  explorer:      { emoji: "🗺️", name: "Explorer" },
  dosha_unlocked:{ emoji: "🌿", name: "Dosha Unlocked" },
  hydration_hero:{ emoji: "💧", name: "Hydration Hero" },
  recipe_lover:  { emoji: "👨‍🍳", name: "Recipe Lover" },
  social_star:   { emoji: "🌟", name: "Social Star" },
};

function ScoreChart({ history }: { history: { date: string; score: number }[] }) {
  if (history.length < 2) return (
    <div className="h-24 flex items-center justify-center text-zinc-600 text-sm">Not enough data yet</div>
  );

  const last14 = history.slice(-14);
  const max = Math.max(...last14.map((h) => h.score), 1);
  const w = 280;
  const h = 80;

  const pts = last14.map((entry, i) => {
    const x = (i / (last14.length - 1)) * w;
    const y = h - (entry.score / max) * (h - 8) - 4;
    return { x, y, ...entry };
  });

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${h} L 0 ${h} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#score-grad)" />
        <path d={path} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => i === pts.length - 1 && (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
        ))}
      </svg>
    </div>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [friendStatus, setFriendStatus] = useState<"none" | "sent" | "friends">("none");
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/social/profile/${username}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/social/setup").then((r) => r.json()).then((d) => setMyUsername(d.username));
    fetch("/api/social/friend").then((r) => r.json()).then((d) => {
      if ((d.friends ?? []).some((f: any) => f.username === username)) setFriendStatus("friends");
    });
  }, [session, username]);

  async function addFriend() {
    setActionLoading(true);
    await fetch("/api/social/friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", targetUsername: username }),
    });
    setFriendStatus("sent");
    setActionLoading(false);
  }

  const isOwnProfile = myUsername === username;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-6xl">😶‍🌫️</div>
          <h2 className="text-2xl font-black text-white">Profile not found</h2>
          <p className="text-zinc-500">@{username} doesn&apos;t exist or is private</p>
          <Link href="/social" className="inline-block text-emerald-400 hover:underline">← Back to Social</Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const doshaInfo = profile.dosha ? DOSHA_INFO[profile.dosha] : null;
  const memberDays = Math.floor((Date.now() - new Date(profile.memberSince).getTime()) / 86400000);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4 space-y-5">

        <Link href="/social" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
          <ArrowLeft className="w-3.5 h-3.5" />
          Social
        </Link>

        {/* profile hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.09] rounded-3xl p-7"
        >
          {/* glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 blur-3xl rounded-full" />

          <div className="relative flex flex-col items-center text-center gap-3">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl"
            >
              {profile.avatarEmoji}
            </motion.div>

            <div>
              <h1 className="text-2xl font-black text-white">@{profile.username}</h1>
              <p className="text-zinc-400 text-sm">{profile.name}</p>
              {profile.bio && <p className="text-zinc-500 text-sm mt-2 max-w-xs">{profile.bio}</p>}
            </div>

            {doshaInfo && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r border ${doshaInfo.color}`}>
                {doshaInfo.emoji} {profile.dosha} · {doshaInfo.desc}
              </span>
            )}

            {/* stats row */}
            <div className="flex gap-6 mt-1">
              <div className="text-center">
                <p className="text-xl font-black text-amber-400">{profile.weeklyScore}</p>
                <p className="text-[11px] text-zinc-600">this week</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-white">{profile.totalScore}</p>
                <p className="text-[11px] text-zinc-600">total pts</p>
              </div>
              <div className="flex flex-col items-center">
                <StreakFire streak={profile.streak} size="sm" />
                <p className="text-[11px] text-zinc-600 mt-1">streak</p>
              </div>
            </div>

            {/* action button */}
            {session && !isOwnProfile && (
              <button
                disabled={friendStatus !== "none" || actionLoading}
                onClick={addFriend}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-sm transition-colors ${
                  friendStatus === "friends"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default"
                    : friendStatus === "sent"
                    ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] cursor-default"
                    : "bg-emerald-500 hover:bg-emerald-400 text-white"
                }`}
              >
                {friendStatus === "friends" ? (
                  <><Check className="w-4 h-4" /> Friends</>
                ) : friendStatus === "sent" ? (
                  <>Request sent ✓</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Add friend</>
                )}
              </button>
            )}

            {isOwnProfile && (
              <Link href="/profile" className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors underline underline-offset-2">
                Edit your profile →
              </Link>
            )}
          </div>
        </motion.div>

        {/* score chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Score trend (last 14 days)
          </h3>
          <ScoreChart history={profile.scoreHistory} />
        </motion.div>

        {/* badges */}
        {profile.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
          >
            <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Badges ({profile.badges.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((id) => {
                const meta = BADGE_META[id] ?? { emoji: "🏅", name: id };
                return (
                  <motion.div
                    key={id}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center gap-1 p-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl min-w-[64px]"
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <span className="text-[10px] text-zinc-500 text-center leading-tight">{meta.name}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* member since */}
        <div className="flex items-center gap-2 text-xs text-zinc-700 px-1">
          <Calendar className="w-3.5 h-3.5" />
          Member for {memberDays} day{memberDays !== 1 ? "s" : ""}
        </div>

      </div>
    </div>
  );
}
