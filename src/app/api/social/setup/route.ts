import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import UserModel from "@/models/User";

// POST /api/social/setup — set username, bio, avatarEmoji
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, bio, avatarEmoji, isPublic } = await req.json();

  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  // validate username: alphanumeric + underscore, 3-20 chars
  if (!/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
    return NextResponse.json({ error: "Username must be 3–20 chars: letters, numbers, underscores only" }, { status: 400 });
  }

  await connectDB();

  // check uniqueness (excluding self)
  const taken = await UserModel.findOne({ username: username.toLowerCase(), email: { $ne: session.user.email } });
  if (taken) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

  const user = await UserModel.findOneAndUpdate(
    { email: session.user.email },
    { username: username.toLowerCase(), bio: bio ?? "", avatarEmoji: avatarEmoji ?? "🧘", isPublic: isPublic ?? true },
    { new: true }
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
    isPublic: user?.isPublic ?? true,
  });
}
