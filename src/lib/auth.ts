import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

// Only the fields the session callback actually copies across.
type SessionUserFields = {
  _id: unknown;
  streak?: number;
  streakShield?: number;
  badges?: string[];
  doshaResult?: { dosha: string; percentage?: Record<string, number> } | null;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NextAuth v5 rejects the sign-in host unless it trusts it; on Vercel the
  // host is dynamic, so trust it explicitly to avoid UntrustedHost errors.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await connectDB();
      const existing = await UserModel.findOne({ email: user.email });
      if (!existing) {
        await UserModel.create({
          name: user.name,
          email: user.email,
          image: user.image,
          streak: 0,
          streakShield: 1,
          lastActiveDate: null,
          badges: [],
          doshaResult: null,
          totalScore: 0,
          scoreHistory: [],
        });
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        await connectDB();
        // The extra fields on session.user are declared in types/next-auth.d.ts,
        // which is what keeps this assignment typed.
        const dbUser = await UserModel.findOne({ email: session.user.email })
          .select("streak streakShield badges doshaResult")
          .lean<SessionUserFields | null>();
        if (dbUser) {
          session.user.id = String(dbUser._id);
          session.user.streak = dbUser.streak;
          session.user.streakShield = dbUser.streakShield;
          session.user.badges = dbUser.badges;
          session.user.doshaResult = dbUser.doshaResult;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
