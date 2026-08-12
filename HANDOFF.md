# SATTVIC — handoff

Read your memory first: `MEMORY.md` links `sattvic-meal-planner.md` and
`sattvic-user-preferences.md`.

Use `/ponytail`. Minimal fixes, blunt feedback, verify in a browser rather than
assuring me. Don't tell me something works unless you tested it.

## State

Live at sattvic.vercel.app, **launch-ready and verified**. Working tree clean,
nothing unpushed. 67 tests pass (`npm test`), typecheck and build clean, zero
runtime errors in the last 24h, all 16 pages return 200.

Done and confirmed: Google sign-in end to end with a real new account, database
writes confirmed in production logs, OAuth consent screen **In production**,
privacy policy live and linked site-wide, Vercel Analytics enabled and counting,
`YOUTUBE_API_KEY` set so YouTube recipe imports work, zero mobile overflow on
every page at 390px, GitHub profile complete (avatar, README, pins, MIT licence,
topics).

## Next task — food memory v1

The agreed next piece. The macro estimates come from an LLM that does not know
nutrition facts, so they vary by phrasing ("3 hashbrowns" vs "3 hash brown
patties" assumed 150g vs 225g of potato). Patching the prompt per food does not
scale. The fix that compounds is **remembering what the user corrected**.

Spec as agreed:

- When someone edits an item's macros in the Adjust panel and adds the meal,
  save `normalised phrase -> macros` under a `sattvic-*` localStorage key.
- On analyse, check that memory first and use the saved numbers when it hits.
- **Deliberately no scaling by quantity.** Same phrase → same numbers. "2 rotis"
  → "5 rotis" needs per-unit values and count parsing out of free text, which is
  a new class of bugs. People log the same things the same way; this cannot be
  wrong.
- Show *"using your saved numbers"* with an undo rather than silently
  overriding — quietly changing numbers is how a tracker loses trust.

**One decision still open** (mine to make, ask me): whether a saved value
overrides silently or visibly. I lean visible.

Free win: CloudSync collects **any** key starting with `sattvic`, so the memory
gets cross-device sync with no backend work and no schema change.

Explicitly **not** doing yet: reading the nutrition label from a photo. Labels
are per-100g or per-serving in a different format on every package, and getting
that wrong is a 3× error, not a small one — it adds a second layer of AI
uncertainty to fix the first.

## Open / unverified

- **The 7-day bars on the dashboard scroll to the week history below — unverified.**
  Lenis owns the scroll and its rAF loop does not run in the headless browser, so
  `document.scrollHeight` reads 0 and nothing scrolls by any method. Click one on
  the real site; if it does nothing, that is the bug to chase.
- A test account may still hold a bogus `first_meal` badge written before the
  ownership fix. Sign in as it and use Delete my account.
- Dependabot has open PRs including **framer-motion 13** and **eslint 10** —
  majors. Framer Motion drives every animation on the site. Do not merge without
  testing; merge the minor/patch group freely.

## Gotchas this codebase has actually been bitten by

- **localStorage is not "the signed-in user's data".** Three separate bugs came
  from assuming it is: the cross-account sync leak, imported recipes, and a
  first-meal badge written into a brand new account. `localDataBelongsTo()`
  requires ownership to be *positively proven*; `isForeignData()` answers the
  different question of whether to wipe. If something looks wrong after
  switching accounts, suspect this first.
- **`scrollIntoView` does nothing while Lenis runs.** Use `scrollToId()` from
  `SmoothScroll`.
- **Animations do not run in the automated browser.** Screenshots come out blank
  and framer-motion elements sit at their `initial` state. Assert against the
  DOM instead of trusting a screenshot.
- **YouTube serves datacenter IPs a stripped page.** Scraping the watch page
  returns an empty description from Vercel; the Data API is why imports work.
- **Grids need a base `grid-cols-1`.** Without it the implicit track sizes to
  max-content and overflows the phone.
- Tests are `node:test`, no framework. `tests/apiAuth.test.ts` reads the routes
  as text to guard the authorization rules — verify a guard test by breaking the
  code on purpose, since two of mine passed while the code was broken.
