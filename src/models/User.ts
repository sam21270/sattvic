import mongoose, { Schema, Document } from "mongoose";

export interface IFriendRequest {
  from: mongoose.Types.ObjectId;
  fromUsername: string;
  sentAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  // social
  username?: string;
  bio?: string;
  avatarEmoji?: string;
  isPublic: boolean;
  friends: mongoose.Types.ObjectId[];
  friendRequests: IFriendRequest[];
  // stats
  streak: number;
  streakShield: number;
  lastActiveDate: string | null;
  badges: string[];
  doshaResult: object | null;
  scoreHistory: { date: string; score: number; grade: string }[];
  totalScore: number;
  // cross-device sync: the whole `sattvic*` localStorage namespace as a blob
  syncData: Record<string, string> | null;
  syncUpdatedAt: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:           { type: String, required: true },
    email:          { type: String, required: true, unique: true },
    image:          { type: String },
    // social
    username:       { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    bio:            { type: String, default: "" },
    avatarEmoji:    { type: String, default: "🧘" },
    // Private by default: the /u/ page is readable by anyone on the internet,
    // so it is opt-in. Friend search does not depend on this flag.
    isPublic:       { type: Boolean, default: false },
    friends:        [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Deliberately stores no copy of the sender's email or real name. A request
    // only needs to say who sent it and let you act on it; duplicating their PII
    // into someone else's document is how it leaked in the first place.
    friendRequests: [{
      from:         { type: Schema.Types.ObjectId, ref: "User" },
      fromUsername: String,
      sentAt:       { type: Date, default: Date.now },
    }],
    // stats
    streak:         { type: Number, default: 0 },
    streakShield:   { type: Number, default: 1 },
    lastActiveDate: { type: String, default: null },
    badges:         [{ type: String }],
    doshaResult:    { type: Schema.Types.Mixed, default: null },
    scoreHistory:   [{ date: String, score: Number, grade: String }],
    totalScore:     { type: Number, default: 0 },
    syncData:       { type: Schema.Types.Mixed, default: null },
    syncUpdatedAt:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
