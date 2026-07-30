# Sattvic

A vegetarian meal planner that reads your Ayurvedic constitution and still
respects your macros. You answer nine questions instead of keeping a food
diary; it plans the week, counts the protein, and decides dinner before you
get home.

**Live:** https://sattvic.vercel.app · Built and shipped solo, AI-assisted —
see [How I used AI](#how-i-used-ai).

> No user base — this is a portfolio project, so the landing page shows how it
> was built rather than testimonials I don't have. Sign in with Google to try
> it against your own data.

## What it does

- **Dosha-aware meal planning** — a curated sattvic meal pool filtered through
  Ayurvedic dosha rules, fasting rules, and micronutrient targets
- **AI food logging** — type "2 rotis, dal, a glass of buttermilk" and an LLM
  turns it into meals and macros; no dropdowns, no barcode scanning
- **Daily tracking** — Sattvic Score, activity rings, macro bars, water,
  streaks and badges
- **Fridge-to-recipe** — three meals you can cook from what's already in
- **Social** — usernames, public profiles at `/u/…`, weekly leaderboard
- Routes: dashboard, meal-planner, dosha, macros, recipes, junk, fridge,
  workout, progress, social, profile

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
MongoDB + Mongoose · NextAuth v5 (Google) · Llama 3.3 70B via Groq ·
Framer Motion · React Three Fiber · Lenis · deployed on Vercel

## Decisions worth explaining

**Nutrition scoring is deterministic, not AI.** The LLM only converts free text
into numbers. The Sattvic Score itself (`src/lib/scoring.ts`) is a plain
weighted function — calories 25, protein 30, meals 20, dosha fit 15,
micronutrients 10. A model that invents your score can't be debugged or
trusted; a pure function can be unit-tested and always explains itself. AI is
used for the fuzzy part only.

**Cross-device sync is last-write-wins, with a guard.** `/api/sync` mirrors the
whole `sattvic*` localStorage namespace into Mongo, comparing client and server
timestamps and rejecting the older writer. It also refuses an empty payload
outright, because the failure mode that actually bites is a freshly-installed
device syncing `{}` upward and wiping a month of logs. Proper per-key merge is
the next step; the timestamp check plus the empty guard covers the real cases
for a single user on two devices.

**Local-first, so the app works before you sign in.** Everything writes to
localStorage first and syncs on auth. You can take the dosha quiz, generate a
week and log meals without an account — signing in upgrades you to
cross-device rather than unlocking the product.

**Accessibility was a measured pass, not a vibe.** Tailwind's `zinc-500` scores
3.8:1 on this near-black surface and `zinc-600` only 2.4:1 — both fail WCAG AA.
White on `emerald-500` measures 2.47:1, on the app's most-used button. The
overrides in `globals.css` carry the measured ratio for each fix in a comment
so the next person can tell intent from accident.

**Animation gets switched off where it costs more than it gives.** Lenis
smooth-scroll and the Three.js hero orb are both disabled on
`(pointer: coarse)` — on a mid-range phone the RAF loop fights native momentum
scrolling and the orb burns frames for decoration.

## How I used AI

Two different things get called "AI" in this repo and they're worth separating.

**Inside the product,** a model does exactly one job: turning "2 rotis, dal, a
glass of buttermilk" into grams. That's where messy human input has to become
structured data, and rules alone handle it badly. Everything downstream — the
Sattvic Score, dosha matching, macro targets, badge thresholds — is
deterministic code that can be read and tested. The split is the whole design:
a model that invents your protein number can't be debugged or trusted, so the
model gets the ambiguity and plain functions get the arithmetic.

**Building it,** I used AI as an assistant — fastest on UI scaffolding,
animation boilerplate, and first drafts of copy. What it didn't decide: the
product itself, the data model, the nutrition and dosha logic, and what to cut.
Some of the better details came from pushing back on the first answer — the
sync endpoint rejects empty payloads because the real failure mode is a fresh
device syncing `{}` upward and wiping a month of logs, which is the kind of
thing you only catch by thinking about your own users.

Short version: AI made me faster at the parts that are typing. It didn't do the
parts that are deciding.

## Known limitations

Being straight about what isn't done:

- **API routes authenticate by `?email=` query param, not the server session.**
  It works, but it means a caller who knows an address can read or write that
  user's sync blob. The fix is `auth()` server-side in each route handler —
  it's the first thing I'd change, and it's marked in the code.
- **No test suite.** Scoring and the dosha rules are pure functions and are the
  obvious place to start.
- **Light theme is unfinished**, so the app ships dark-only; the
  `[data-theme="light"]` CSS is still in the repo but unreachable.
- Recipe and food photography is placeholder.

## Run locally

```bash
npm install
npm run dev
```

Needs a `.env.local`:

```
MONGODB_URI=…
NEXTAUTH_SECRET=…
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
GROQ_API_KEY=…
```

`@anthropic-ai/sdk` is still in `package.json` from an earlier iteration but
nothing imports it — it can be dropped.
