/**
 * The single place that decides what one user may see about another.
 *
 * Every social endpoint projects through these functions rather than picking
 * fields inline, because the leak that shipped was exactly that: a route
 * returned a Mongo document as-is and the sender's email address went with it.
 * If a field isn't listed here, it doesn't leave the server.
 *
 * Deliberately NOT exposed to anyone:
 *   email        — account identity, and spammable
 *   name         — the real name from Google; a username is enough to compete
 *   doshaResult  — health-adjacent inference about someone's body
 *   scoreHistory — a day-by-day behavioural log
 *   syncData     — the user's entire app state
 */

/** Mongo `.select()` string — never fetch what we won't send. */
export const SOCIAL_FIELDS = "username avatarEmoji bio streak scoreHistory";

type SocialDoc = {
  _id?: unknown;
  username?: string | null;
  avatarEmoji?: string | null;
  bio?: string | null;
  streak?: number | null;
  scoreHistory?: { date: string; score: number }[] | null;
};

/** What a friend sees: enough to compete, nothing personal. */
export interface FriendView {
  id: string;
  username: string;
  avatarEmoji: string;
  streak: number;
  todayScore: number;
  weeklyScore: number;
}

/** What a stranger sees in search: only enough to recognise who to add. */
export interface StrangerView {
  id: string;
  username: string;
  avatarEmoji: string;
  bio: string;
}

/** Sum of the last 7 days of scores. */
export function weeklyScore(history: { date: string; score: number }[] = []): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return history
    .filter((h) => new Date(h.date) >= cutoff)
    .reduce((s, h) => s + (h.score ?? 0), 0);
}

/** Today's score, or 0 if nothing is logged yet. */
export function todayScore(history: { date: string; score: number }[] = []): number {
  const today = new Date().toISOString().slice(0, 10);
  return history.find((h) => h.date === today)?.score ?? 0;
}

export function toFriendView(u: SocialDoc): FriendView {
  const history = u.scoreHistory ?? [];
  return {
    id: String(u._id ?? ""),
    username: u.username ?? "",
    avatarEmoji: u.avatarEmoji || "🧘",
    streak: u.streak ?? 0,
    todayScore: todayScore(history),
    weeklyScore: weeklyScore(history),
  };
}

export function toStrangerView(u: SocialDoc): StrangerView {
  return {
    id: String(u._id ?? ""),
    username: u.username ?? "",
    avatarEmoji: u.avatarEmoji || "🧘",
    bio: u.bio ?? "",
  };
}

/**
 * The one username rule, used by both signup and lookup. Usernames go into a
 * Mongo query and into public URLs, so anything outside [a-z0-9_] is rejected
 * rather than escaped — that keeps regex metacharacters and NoSQL operators
 * out of the query entirely.
 */
export function isValidUsername(u: unknown): u is string {
  return typeof u === "string" && /^[a-z0-9_]{3,20}$/.test(u);
}
