// Guards the account-switch leak: two people using one browser must never end
// up sharing data. This regressed in production once — a signed-out user's
// meals were pushed into the next person's account — so the rule gets a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isForeignData, localDataBelongsTo } from "../src/lib/syncOwner.ts";

test("data from a different account is treated as foreign", () => {
  assert.equal(isForeignData("sanika@example.com", "wriya@example.com"), true,
    "a second user signing in must not inherit the first user's data");
});

test("your own data is not foreign", () => {
  assert.equal(isForeignData("sanika@example.com", "sanika@example.com"), false);
});

test("an untagged blob is not foreign", () => {
  // Data written before sign-in belongs to whoever signs in first — that's the
  // local-first upgrade path, not a leak.
  assert.equal(isForeignData(null, "sanika@example.com"), false);
});

test("no signed-in user means nothing to compare against", () => {
  assert.equal(isForeignData("sanika@example.com", null), false);
});

/* ── reading local data back as this account's ─────────────────── */

// isForeignData answers "must this be wiped?". localDataBelongsTo answers the
// different question "may this be shown as yours?", and the gap between them is
// where a real bug lived: a brand new account was shown a "Logged your first
// meal" badge computed from the previous person's meals on that browser.

function withLocalStorage(entries: Record<string, string>, run: () => void) {
  const store = new Map(Object.entries(entries));
  (globalThis as any).window = {
    localStorage: { getItem: (k: string) => store.get(k) ?? null },
  };
  try { run(); } finally { delete (globalThis as any).window; }
}

test("local data is this account's only when the owner tag matches", () => {
  withLocalStorage({ "sattvic-sync-owner": "sanika@example.com" }, () => {
    assert.equal(localDataBelongsTo("sanika@example.com"), true);
    assert.equal(localDataBelongsTo("arjun@example.com"), false);
  });
});

test("unowned local data is never credited to whoever signs in next", () => {
  // The actual failure: browsing signed-out leaves data with no owner tag.
  // isForeignData says false — correctly, it should not be wiped — but that
  // must not be read as "it belongs to the new account".
  withLocalStorage({}, () => {
    assert.equal(localDataBelongsTo("arjun@example.com"), false);
  });
  assert.equal(isForeignData(null, "arjun@example.com"), false, "unowned data is not foreign");
});

test("no signed-in email means local data belongs to nobody", () => {
  withLocalStorage({ "sattvic-sync-owner": "sanika@example.com" }, () => {
    assert.equal(localDataBelongsTo(null), false);
    assert.equal(localDataBelongsTo(undefined), false);
  });
});

test("server-side rendering has no storage and must not guess", () => {
  assert.equal(localDataBelongsTo("sanika@example.com"), false);
});
