// Guards the account-switch leak: two people using one browser must never end
// up sharing data. This regressed in production once — a signed-out user's
// meals were pushed into the next person's account — so the rule gets a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isForeignData } from "../src/lib/syncOwner.ts";

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
