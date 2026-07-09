# Sattvic

An Ayurvedic nutrition & lifestyle companion — meal planning, dosha-aware
food guidance, and daily habit tracking, wrapped in a polished animated UI.

## What it does

- **Dosha-aware meal planning** — a curated sattvic meal pool filtered through
  Ayurvedic dosha rules, fasting rules, and micronutrient targets
- **AI food logging** — describe what you ate in plain language; the app
  parses it into meals and macros using LLMs (Anthropic Claude / Groq)
- **Daily tracking** — activity rings, macro bars, water tracker, streaks,
  badges and a journey roadmap to keep the habit alive
- **Fridge-to-recipe** — suggest sattvic recipes from what's on hand
- **Social** — public profile pages (`/u/…`), usernames, and shareable progress
- Routes: dashboard, meal-planner, dosha quiz, macros, recipes, fridge,
  workout, progress, profile, social

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **MongoDB + Mongoose**, **NextAuth v5** for auth
- **Anthropic & Groq SDKs** for AI meal parsing
- **Framer Motion, Three.js / React Three Fiber, Lenis** for the animated UI
- Tailwind CSS 4

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Requires a `.env.local` with MongoDB, NextAuth, and AI-provider keys
(`MONGODB_URI`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, …).
