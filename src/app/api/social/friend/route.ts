import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

// POST /api/social/friend
// body: { action: "send"|"accept"|"decline"|"remove", targetUsername: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, targetUsername } = await req.json();
  await connectDB();

  const me = await UserModel.findOne({ email: session.user.email });
  const them = await UserModel.findOne({ username: targetUsername.toLowerCase() });

  if (!me || !them) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (me._id.equals(them._id)) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

  if (action === "send") {
    // check already friends
    if (me.friends.some((f: any) => f.equals(them._id))) {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }
    // check already requested
    if (them.friendRequests.some((r: any) => r.from.equals(me._id))) {
      return NextResponse.json({ error: "Request already sent" }, { status: 409 });
    }
    them.friendRequests.push({
      from: me._id as any,
      fromEmail: me.email,
      fromName: me.name,
      fromUsername: me.username ?? me.name,
      sentAt: new Date(),
    });
    await them.save();
    return NextResponse.json({ ok: true, message: "Friend request sent!" });
  }

  if (action === "accept") {
    // remove the request from me
    me.friendRequests = me.friendRequests.filter((r: any) => !r.from.equals(them._id)) as any;
    // add each other as friends
    if (!me.friends.some((f: any) => f.equals(them._id))) me.friends.push(them._id as any);
    if (!them.friends.some((f: any) => f.equals(me._id))) them.friends.push(me._id as any);
    await me.save();
    await them.save();
    return NextResponse.json({ ok: true, message: "You're now friends! 🎉" });
  }

  if (action === "decline") {
    me.friendRequests = me.friendRequests.filter((r: any) => !r.from.equals(them._id)) as any;
    await me.save();
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    me.friends = me.friends.filter((f: any) => !f.equals(them._id)) as any;
    them.friends = them.friends.filter((f: any) => !f.equals(me._id)) as any;
    await me.save();
    await them.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET /api/social/friend — get friend requests + friend list
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const me = await UserModel.findOne({ email: session.user.email })
    .populate("friends", "username name avatarEmoji bio doshaResult totalScore streak badges scoreHistory")
    .lean() as any;

  const requests = me?.friendRequests ?? [];
  const friends = (me?.friends ?? []).map((f: any) => ({
    id: f._id.toString(),
    username: f.username,
    name: f.name,
    avatarEmoji: f.avatarEmoji ?? "🧘",
    bio: f.bio ?? "",
    dosha: f.doshaResult?.dosha ?? null,
    totalScore: f.totalScore ?? 0,
    streak: f.streak ?? 0,
    badges: f.badges ?? [],
    weeklyScore: weeklyScore(f.scoreHistory ?? []),
  }));

  return NextResponse.json({ requests, friends });
}

function weeklyScore(history: { date: string; score: number }[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return history
    .filter((h) => new Date(h.date) >= cutoff)
    .reduce((s, h) => s + h.score, 0);
}
