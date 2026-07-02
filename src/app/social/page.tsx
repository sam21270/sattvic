"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search, UserPlus, Trophy, Users, Bell, Check, X,
  Flame, Zap, Crown, Star, Share2, Copy, CheckCheck
} from "lucide-react";
import { UsernameSetup } from "@/components/social/UsernameSetup";
import { Confetti } from "@/components/ui/Confetti";

interface FriendUser {
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
}

interface FriendRequest {
  from: string;
  fromEmail: string;
  fromName: string;
  fromUsername: string;
  sentAt: string;
}

const DOSHA_COLOR: Record<string, string> = {
  Vata: "text-violet-400 bg-violet-500/15 border-violet-500/30",
  Pitta: "text-rose-400 bg-rose-500/15 border-rose-500/30",
  Kapha: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
};

const RANK_STYLE = [
  { bg: "bg-amber-500/20 border-amber-500/40", icon: Crown, color: "text-amber-400" },
  { bg: "bg-zinc-500/15 border-zinc-500/30",   icon: Star,  color: "text-zinc-300"  },
  { bg: "bg-orange-500/15 border-orange-500/30",icon: Zap,  color: "text-orange-400"},
];

const CHALLENGES = [
  {
    id: "streak_7",
    emoji: "🔥",
    title: "7-Day Streak",
    desc: "Log every day for 7 days in a row",
    points: 70,
    color: "from-orange-500/20 to-rose-500/20 border-orange-500/30",
  },
  {
    id: "protein_king",
    emoji: "💪",
    title: "Protein King",
    desc: "Hit protein goal 5 days this week",
    points: 50,
    color: "from-blue-500/20 to-violet-500/20 border-blue-500/30",
  },
  {
    id: "clean_week",
    emoji: "🥗",
    title: "Clean Week",
    desc: "Score 80+ every day for a week",
    points: 140,
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  },
  {
    id: "social_butterfly",
    emoji: "🦋",
    title: "Social Butterfly",
    desc: "Add 3 friends and compare scores",
    points: 30,
    color: "from-violet-500/20 to-pink-500/20 border-violet-500/30",
  },
];

export default function SocialPage() {
  const { data: session } = useSession();
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tab, setTab] = useState<"leaderboard" | "requests" | "challenges">("leaderboard");
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");
  const [confetti, setConfetti] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!session) return;
    // get own username
    fetch("/api/social/setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.username) setMyUsername(d.username);
        else if (session.user) setShowSetup(true);
      });
    // load friends + requests
    loadFriends();
  }, [session]);

  function loadFriends() {
    fetch("/api/social/friend")
      .then((r) => r.json())
      .then((d) => {
        setFriends(d.friends ?? []);
        setRequests(d.requests ?? []);
      });
  }

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      const res = await fetch(`/api/social/search?q=${encodeURIComponent(searchQ)}`);
      const data = await res.json();
      setSearchResults(data.users ?? []);
      setSearchLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  async function sendRequest(username: string) {
    setPendingActions((p) => ({ ...p, [username]: true }));
    const res = await fetch("/api/social/friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", targetUsername: username }),
    });
    const data = await res.json();
    showToast(data.message ?? data.error);
    setPendingActions((p) => ({ ...p, [username]: false }));
  }

  async function respondRequest(fromUsername: string, action: "accept" | "decline") {
    const res = await fetch("/api/social/friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetUsername: fromUsername }),
    });
    const data = await res.json();
    if (action === "accept" && res.ok) { setConfetti(true); setTimeout(() => setConfetti(false), 100); }
    showToast(data.message ?? (action === "accept" ? "Friends! 🎉" : "Declined"));
    loadFriends();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function copyProfileLink() {
    if (!myUsername) return;
    navigator.clipboard.writeText(`${window.location.origin}/u/${myUsername}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // leaderboard = friends + me, sorted by weekly score
  const myEntry: FriendUser | null = myUsername
    ? { id: "me", username: myUsername, name: session?.user?.name ?? "You", avatarEmoji: "🧘", bio: "", dosha: null, totalScore: 0, weeklyScore: 0, streak: 0, badges: [] }
    : null;

  const leaderboard = [...friends, ...(myEntry ? [myEntry] : [])].sort((a, b) => b.weeklyScore - a.weeklyScore);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🧘</div>
          <h2 className="text-2xl font-black text-white">Sign in to go social</h2>
          <p className="text-zinc-500">Create your profile and challenge friends</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16">
      <Confetti trigger={confetti} />

      {showSetup && !myUsername && (
        <UsernameSetup onComplete={(u) => { setMyUsername(u); setShowSetup(false); showToast("Profile created! 🎉"); }} />
      )}

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 bg-emerald-500 text-white font-semibold rounded-2xl shadow-lg text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* header */}
        <div>
          <h1 className="text-3xl font-black text-white">Social</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Compete, climb the leaderboard, win challenges</p>
        </div>

        {/* profile card */}
        {myUsername && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/15 to-violet-500/10 border border-emerald-500/20 rounded-3xl p-5"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">{/* avatarEmoji from server */}🧘</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">@{myUsername}</h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">You</span>
                </div>
                <p className="text-zinc-400 text-sm">{session.user?.name}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={copyProfileLink}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-zinc-300 hover:bg-white/[0.1] transition-colors"
                >
                  {copiedLink ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? "Copied!" : "Share link"}
                </button>
                <Link href={`/u/${myUsername}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
                  View public profile →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* not set up */}
        {!myUsername && (
          <button
            onClick={() => setShowSetup(true)}
            className="w-full p-5 border border-dashed border-white/[0.15] rounded-3xl text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors flex items-center justify-center gap-3"
          >
            <UserPlus className="w-5 h-5" />
            Set up your social profile to compete
          </button>
        )}

        {/* search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by username…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {searchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
          )}
        </div>

        {/* search results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden"
            >
              {searchResults.map((u) => {
                const isFriend = friends.some((f) => f.username === u.username);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-4 border-b border-white/[0.05] last:border-0">
                    <span className="text-3xl">{u.avatarEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/u/${u.username}`} className="font-bold text-white hover:text-emerald-400 transition-colors">
                          @{u.username}
                        </Link>
                        {u.dosha && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${DOSHA_COLOR[u.dosha] ?? ""}`}>
                            {u.dosha}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{u.bio || u.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-amber-400">{u.weeklyScore} pts</p>
                        <p className="text-[10px] text-zinc-600">this week</p>
                      </div>
                      {!isFriend ? (
                        <button
                          disabled={pendingActions[u.username]}
                          onClick={() => sendRequest(u.username)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-600 font-medium">Friends ✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* tab bar */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          {([
            { key: "leaderboard", label: "Leaderboard", icon: Trophy },
            { key: "requests",    label: `Requests${requests.length > 0 ? ` (${requests.length})` : ""}`, icon: Bell },
            { key: "challenges",  label: "Challenges",  icon: Zap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-white/[0.09] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* leaderboard tab */}
        {tab === "leaderboard" && (
          <div className="space-y-3">
            {leaderboard.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-zinc-400">No friends yet</p>
                <p className="text-sm mt-1">Search for friends above to start competing</p>
              </div>
            )}
            {leaderboard.map((u, i) => {
              const isMe = u.id === "me";
              const rankStyle = RANK_STYLE[i] ?? { bg: "bg-white/[0.03] border-white/[0.07]", icon: null, color: "text-zinc-500" };
              const RankIcon = rankStyle.icon;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-4 p-4 border rounded-2xl ${rankStyle.bg} ${isMe ? "ring-1 ring-emerald-500/30" : ""}`}
                >
                  {/* rank */}
                  <div className={`w-8 text-center font-black text-lg ${rankStyle.color}`}>
                    {RankIcon ? <RankIcon className="w-5 h-5 mx-auto" /> : `#${i + 1}`}
                  </div>

                  <span className="text-3xl">{u.avatarEmoji}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={isMe ? `/u/${u.username}` : `/u/${u.username}`} className="font-bold text-white hover:text-emerald-400 transition-colors truncate">
                        @{u.username}
                      </Link>
                      {isMe && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">you</span>}
                      {u.dosha && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold hidden sm:inline ${DOSHA_COLOR[u.dosha] ?? ""}`}>
                          {u.dosha}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-zinc-500">🔥 {u.streak} day streak</span>
                      {u.badges.length > 0 && (
                        <span className="text-[11px] text-zinc-600">{u.badges.slice(0, 3).join(" ")}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-black ${i === 0 ? "text-amber-400" : "text-white"}`}>
                      {u.weeklyScore}
                    </p>
                    <p className="text-[10px] text-zinc-600">this week</p>
                  </div>
                </motion.div>
              );
            })}

            {leaderboard.length > 0 && (
              <p className="text-center text-xs text-zinc-700 pt-2">Scores reset weekly · Updates daily</p>
            )}
          </div>
        )}

        {/* requests tab */}
        {tab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-zinc-400">No pending requests</p>
                <p className="text-sm mt-1">Share your profile link to get friend requests</p>
              </div>
            )}
            {requests.map((req) => (
              <motion.div
                key={req.fromEmail}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-white/[0.04] border border-white/[0.07] rounded-2xl"
              >
                <span className="text-3xl">🧘</span>
                <div className="flex-1">
                  <p className="font-bold text-white">@{req.fromUsername || req.fromName}</p>
                  <p className="text-xs text-zinc-500">Wants to be friends · {new Date(req.sentAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondRequest(req.fromUsername, "accept")}
                    className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/25 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => respondRequest(req.fromUsername, "decline")}
                    className="p-2 bg-white/[0.05] border border-white/[0.08] text-zinc-500 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* friends list below */}
            {friends.length > 0 && (
              <>
                <p className="text-xs text-zinc-600 uppercase tracking-widest pt-2 font-semibold">Your friends ({friends.length})</p>
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <span className="text-2xl">{f.avatarEmoji}</span>
                    <div className="flex-1">
                      <Link href={`/u/${f.username}`} className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors">
                        @{f.username}
                      </Link>
                      <p className="text-xs text-zinc-600">{f.streak} day streak · {f.weeklyScore} pts this week</p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch("/api/social/friend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove", targetUsername: f.username }) });
                        loadFriends();
                        showToast("Removed friend");
                      }}
                      className="text-xs text-zinc-700 hover:text-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* challenges tab */}
        {tab === "challenges" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600">Complete challenges to earn bonus points and outrank your friends</p>
            {CHALLENGES.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative overflow-hidden p-5 bg-gradient-to-br ${c.color} border rounded-2xl`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{c.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-base">{c.title}</h3>
                    <p className="text-zinc-400 text-sm mt-0.5">{c.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-amber-400">+{c.points}</div>
                    <div className="text-[10px] text-zinc-600">points</div>
                  </div>
                </div>

                {/* fake progress for now */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">Progress</span>
                    <span className="text-zinc-400">0 / {c.points / 10}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-4 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl text-center">
              <p className="text-zinc-600 text-sm">More challenges coming soon 🚀</p>
              <p className="text-zinc-700 text-xs mt-0.5">Weekly drops every Monday</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
