import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        const dbUser = await UserModel.findOne({ email: session.user.email }).lean() as any;
        if (dbUser) {
          (session.user as any).id = dbUser._id.toString();
          (session.user as any).streak = dbUser.streak;
          (session.user as any).streakShield = dbUser.streakShield;
          (session.user as any).badges = dbUser.badges;
          (session.user as any).doshaResult = dbUser.doshaResult;
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
