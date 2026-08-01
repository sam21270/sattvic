import { NextRequest, NextResponse } from "next/server";

// The AI routes are unauthenticated by design (you can try the app before
// signing in), which also means anyone can point a loop at them and burn the
// Groq quota — taking the feature down for real users and costing money.
//
// ponytail: in-memory fixed window, per IP. The ceiling is that serverless
// spreads requests across instances, so the real limit is roughly this times
// the instance count — enough to stop a naive script, not a distributed one.
// Move to Upstash/Redis if abuse actually shows up in the logs.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

const hits = new Map<string, { count: number; resetAt: number }>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    // Opportunistic sweep so the map can't grow without bound.
    if (hits.size > 5000) for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    return false;
  }
  rec.count++;
  return rec.count > MAX_PER_WINDOW;
}

export function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (tooMany(ip)) {
    return NextResponse.json(
      { error: "Too many requests — give it a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/ai/:path*" };
