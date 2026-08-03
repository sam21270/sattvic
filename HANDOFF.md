Continuing work on SATTVIC (sattvic-app/). Read your memory files first —
MEMORY.md links sattvic-meal-planner.md, sattvic-security-hardening.md and
sattvic-user-preferences.md, which have the full context.

STATE: everything committed, pushed, deployed. Live at sattvic.vercel.app.
Working tree clean. 28 tests pass (`npm test`). Build + typecheck clean.

Last session was a security pass before launching publicly on LinkedIn.
Fixed: friend-request Gmail leak, cross-account sync leak (two people on one
browser), SSRF in /api/ai/recipe-import, an IDOR endpoint, client-supplied
?email= auth on /api/user and /api/sync, hardcoded "Sanika" greeting.
Added: CSP + security headers, rate limiting, private-by-default profiles,
Dependabot, scripts/purge-stored-pii.mjs and scripts/delete-user.mjs.

TWO THINGS TO DO NEXT:
1. Nobody has signed in since the Atlas DB role was scoped to readWrite on
   `sattvic`. Account-creation WRITES are unverified. Test: incognito ->
   sign in with Google -> dashboard should greet by name -> log a meal ->
   refresh, it should persist. If sign-in errors, the Atlas role needs fixing.
2. Then a second person signs in and confirms they see ONLY their own data
   (that's the bug Wriya hit).

GOTCHA THAT TOOK PROD DOWN LAST TIME: Vercel's MONGODB_URI ends in /sattvic,
but local .env.local has no DB name so it silently uses Mongo's default `test`
database (which holds unrelated old projects). Any script needs
MONGODB_DB="sattvic". Worth fixing .env.local to match Vercel.

Use /ponytail. I prefer minimal fixes, blunt feedback, and verify-in-browser
rather than assurances. Don't tell me something works unless you tested it.
