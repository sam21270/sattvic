import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";
import { isValidUsername } from "@/lib/socialView";

// POST /api/social/setup — set username, bio, avatarEmoji
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, bio, avatarEmoji, isPublic } = await req.json();

  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  // validate username: alphanumeric + underscore, 3-20 chars
  if (!isValidUsername(String(username).toLowerCase())) {
    return NextResponse.json({ error: "Username must be 3–20 chars: letters, numbers, underscores only" }, { status: 400 });
  }

  // Bound the free-text fields: they are stored and shown to other people, so
  // an unbounded bio is storage abuse and a wall of text in someone's list.
  const safeBio = String(bio ?? "").slice(0, 160).trim();
  const safeAvatar = [...String(avatarEmoji ?? "🧘")].slice(0, 2).join("") || "🧘";

  await connectDB();

  // check uniqueness (excluding self)
  const taken = await UserModel.findOne({ username: username.toLowerCase(), email: { $ne: session.user.email } });
  if (taken) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

  const user = await UserModel.findOneAndUpdate(
    { email: session.user.email },
    { username: username.toLowerCase(), bio: safeBio, avatarEmoji: safeAvatar, isPublic: isPublic === true },
    { returnDocument: "after" }
  );

  return NextResponse.json({ ok: true, username: user?.username });
}

// GET /api/social/setup — get current user's social profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await UserModel.findOne({ email: session.user.email }).lean() as any;
  return NextResponse.json({
    username: user?.username ?? null,
    bio: user?.bio ?? "",
    avatarEmoji: user?.avatarEmoji ?? "🧘",
    isPublic: user?.isPublic === true,
  });
}
