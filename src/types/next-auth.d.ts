import type { DefaultSession } from "next-auth";

// The session callback in lib/auth.ts copies a few User fields onto
// session.user so pages can read them without a round trip. Declaring them
// here is what makes that typed instead of a pile of `as any` casts.
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      streak?: number;
      streakShield?: number;
      badges?: string[];
      doshaResult?: { dosha: string; percentage?: Record<string, number> } | null;
    } & DefaultSession["user"];
  }
}
