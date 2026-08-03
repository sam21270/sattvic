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

/**
 * Content-Security-Policy.
 *
 * Why no nonce, deliberately: most pages here are statically prerendered, so
 * their HTML is built once and cannot carry a per-request nonce. Next only
 * stamps nonces onto dynamically rendered routes. A nonce policy therefore
 * blocked every script on the static pages — verified: /macros shipped 13
 * script tags with zero nonces, and the app rendered but never hydrated.
 * Making every page dynamic to satisfy a scanner would cost real speed for no
 * real safety, so the policy is built around what static output actually needs.
 *
 * 'unsafe-inline' in script-src is the honest cost of that. What the policy
 * still buys, which is not nothing:
 *  - an injected <script src="//evil.com"> is blocked; only same-origin runs
 *  - object-src 'none' removes plugin and embed vectors
 *  - base-uri 'none' stops a <base> tag rewriting every relative URL
 *  - form-action 'self' stops a form being repointed at an attacker
 *  - connect-src 'self' stops exfiltration to a third-party host
 * Inline-injection risk is separately mitigated: React escapes by default and
 * this codebase has no dangerouslySetInnerHTML in any user-facing path.
 */
function buildCsp(): string {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",       // Unsplash photos + Google avatars
    "font-src 'self' data:",
    // accounts.google.com is required by both: signing in POSTs to
    // /api/auth/signin/google, which 302s to Google. connect-src is checked
    // when next-auth's fetch follows that redirect, form-action when the
    // form-POST path follows it. With 'self' alone both are blocked and the
    // Sign in button silently does nothing — verified in the browser.
    "connect-src 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",                        // no Flash/embed vectors
    "base-uri 'none'",                          // stops <base> hijacking relative URLs
    "form-action 'self' https://accounts.google.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const rule = LIMITS.find(([prefix]) => path.startsWith(prefix));
  if (rule) {
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

  const res = NextResponse.next();
  res.headers.set("content-security-policy", buildCsp());
  return res;
}

export const config = {
  matcher: [
    "/api/ai/:path*",
    "/api/social/:path*",
    // Every page, but not Next's own static output or the image optimiser —
    // hashing a policy onto immutable assets buys nothing.
    { source: "/((?!_next/static|_next/image|favicon.ico).*)", missing: [{ type: "header", key: "next-router-prefetch" }] },
  ],
};
