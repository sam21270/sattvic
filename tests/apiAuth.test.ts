// Run with `npm test`.
//
// These do not mock anything. They read the API routes as text and assert the
// two rules that were actually broken here before:
//
//   1. /api/user and /api/sync took a client-supplied ?email=, so knowing an
//      address was enough to read or overwrite someone else's account.
//   2. Two people on one browser could see each other's synced data.
//
// Both were fixed by deciding identity from the session and nothing else. A
// mocked handler test would prove one route behaves today; this proves the rule
// still holds across every route, including ones nobody has written yet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const API_DIR = "src/app/api";

function routeFiles(dir = API_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? routeFiles(p) : e.name === "route.ts" ? [p] : [];
  });
}

/**
 * Routes that are unauthenticated on purpose:
 *  - ai/*   you can try the app before signing in; rate-limited in middleware
 *  - auth/* NextAuth's own handler
 *  - social/profile/[username]  public profiles, and it filters isPublic itself
 */
const PUBLIC_ON_PURPOSE = [/\/api\/ai\//, /\/api\/auth\//, /\/api\/social\/profile\//];
const isPublic = (f: string) => PUBLIC_ON_PURPOSE.some((re) => re.test(f.replace(/\\/g, "/")));

const files = routeFiles();

test("there are API routes to check at all", () => {
  // Guards against the walker silently finding nothing and every test passing.
  assert.ok(files.length >= 15, `only found ${files.length} route files`);
});

test("every route handling user data checks the session", () => {
  for (const file of files.filter((f) => !isPublic(f))) {
    const src = readFileSync(file, "utf8");
    const handlers = src.match(/export async function (GET|POST|PATCH|PUT|DELETE)/g) ?? [];
    const authCalls = src.match(/await auth\(\)/g) ?? [];
    assert.ok(
      authCalls.length >= handlers.length,
      `${file}: ${handlers.length} handler(s) but only ${authCalls.length} auth() call(s)`,
    );
    assert.match(src, /401/, `${file}: never returns 401, so it cannot be refusing anyone`);
  }
});

test("no route takes the caller's identity from the request", () => {
  // The exact shape of the original hole: ?email=, or an email/userId off the
  // body. Session-derived reads (session.user.email) are what should be used.
  const forbidden = [
    /searchParams\.get\(\s*["'](email|userId|user)["']\s*\)/,
    /(?:const|let)\s*\{[^}]*\b(email|userId)\b[^}]*\}\s*=\s*(?:await\s*)?req\.json\(\)/,
    /body\.(email|userId)\b/,
  ];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const re of forbidden) {
      assert.ok(!re.test(src), `${file}: reads identity from the request — ${re}`);
    }
  }
});

test("the account deletion route never names who to delete", () => {
  // A delete endpoint that accepts an id is the IDOR shape this codebase has
  // already been bitten by, and deletion is the one that cannot be undone.
  const src = readFileSync("src/app/api/user/delete/route.ts", "utf8");
  assert.match(src, /await auth\(\)/);
  assert.ok(!/params|searchParams|req\.json\(\)/.test(src), "delete route reads input it should not");
  // References must be pulled before the account, or they outlive it.
  assert.ok(
    src.indexOf("updateMany") < src.indexOf("deleteOne"),
    "deletes the account before cleaning up references to it",
  );
});

test("the sync route bounds what it will store", () => {
  const src = readFileSync("src/app/api/sync/route.ts", "utf8");
  assert.match(src, /MAX_SYNC_BYTES/, "no size ceiling on the synced blob");
  // Scoped to POST: GET connects to the database first, and comparing indexes
  // across the whole file measured that instead of what this is about.
  const post = src.slice(src.indexOf("export async function POST"));
  assert.ok(post.includes("MAX_SYNC_BYTES"), "POST does not apply the ceiling");
  assert.ok(
    post.indexOf("MAX_SYNC_BYTES") < post.indexOf("connectDB()"),
    "size check runs after connectDB, so a rejected payload still costs a query",
  );
});

test("nothing writes local data to an account without proving ownership", () => {
  // Three separate bugs have come from treating localStorage as belonging to
  // whoever happens to be signed in: the sync leak, the imported-recipe cache,
  // and a first-meal badge written into a brand new account from the previous
  // person's meals. Both paths that upload local data now check first.
  // Match the guard wrapping the call, not merely the helper being imported —
  // an earlier version of this test compared index-of against the import line
  // and passed happily with the guard deleted.
  const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
  assert.match(
    dashboard,
    /if\s*\(\s*localDataBelongsTo\([^)]*\)\s*\)\s*\{\s*pushScore\(/,
    "dashboard pushes the local score without checking the local data is this account's",
  );

  const cloudSync = readFileSync("src/components/ui/CloudSync.tsx", "utf8");
  const pushFn = cloudSync.slice(cloudSync.indexOf("async function push()"));
  assert.ok(
    pushFn.indexOf("OWNER_KEY") < pushFn.indexOf('fetch("/api/sync"'),
    "CloudSync uploads before checking who the blob belongs to",
  );
});
