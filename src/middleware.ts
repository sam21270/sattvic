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
// AI calls are slow and cost money; social calls are cheap but enable
// username probing and friend-request spam, so they get a looser cap.
const LIMITS: [prefix: string, max: number][] = [
  ["/api/ai/", 20],
  ["/api/social/", 60],
];

const hits = new Map<string, { count: number; resetAt: number }>();

function tooMany(ip: string, max: number): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    // Opportunistic sweep so the map can't grow without bound.
    if (hits.size > 5000) for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    return false;
  }
  rec.count++;
  return rec.count > max;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const rule = LIMITS.find(([prefix]) => path.startsWith(prefix));
  if (!rule) return NextResponse.next();

  // Key by IP *and* bucket so heavy AI use can't lock someone out of social.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (tooMany(`${rule[0]}${ip}`, rule[1])) {
    return NextResponse.json(
      { error: "Too many requests — give it a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/ai/:path*", "/api/social/:path*"] };
