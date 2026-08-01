// Social projections are a security boundary: a route once returned a Mongo
// document as-is and leaked the sender's email to whoever got the friend
// request. These tests assert the forbidden fields can never come back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toFriendView, toStrangerView, weeklyScore, todayScore, SOCIAL_FIELDS, isValidUsername } from "../src/lib/socialView.ts";

// A document with everything sensitive still attached, as Mongo would hand it over.
const doc = {
  _id: "abc123",
  username: "wriya",
  name: "Wriya Real Name",
  email: "wriya@gmail.com",
  avatarEmoji: "🌿",
  bio: "hi",
  streak: 5,
  doshaResult: { dosha: "Vata" },
  syncData: { "sattvic-foodlog": "secret" },
  scoreHistory: [{ date: new Date().toISOString().slice(0, 10), score: 72 }],
};

const FORBIDDEN = ["email", "name", "doshaResult", "dosha", "syncData", "scoreHistory", "friendRequests"];

test("a friend view never carries email, real name, dosha or raw history", () => {
  const v = toFriendView(doc);
  // exact keys, not substrings — "username" legitimately contains "name"
  for (const f of FORBIDDEN) assert.ok(!(f in v), `friend view leaked key "${f}"`);
  const s = JSON.stringify(v);
  assert.ok(!s.includes("wriya@gmail.com"), "friend view leaked the email value");
  assert.ok(!s.includes("Wriya Real Name"), "friend view leaked the real name");
  assert.ok(!s.includes("Vata"), "friend view leaked the dosha value");
  assert.ok(!s.includes("secret"), "friend view leaked synced app data");
});

test("a stranger sees only username, avatar and bio", () => {
  const v = toStrangerView(doc);
  assert.deepEqual(Object.keys(v).sort(), ["avatarEmoji", "bio", "id", "username"]);
  for (const f of FORBIDDEN) assert.ok(!(f in v), `stranger view leaked key "${f}"`);
  const s = JSON.stringify(v);
  assert.ok(!s.includes("wriya@gmail.com") && !s.includes("Wriya Real Name") && !s.includes("Vata"),
    "stranger view leaked a sensitive value");
  // strangers must not learn how someone is doing, only that they exist
  assert.ok(!("streak" in v) && !("weeklyScore" in v), "strangers must not see scores");
});

test("friends see the competitive numbers and nothing else", () => {
  const v = toFriendView(doc);
  assert.deepEqual(Object.keys(v).sort(),
    ["avatarEmoji", "id", "streak", "todayScore", "username", "weeklyScore"]);
  assert.equal(v.streak, 5);
  assert.equal(v.todayScore, 72);
});

test("the select string never requests email or name", () => {
  for (const f of ["email", "name", "doshaResult", "syncData"]) {
    assert.ok(!SOCIAL_FIELDS.split(" ").includes(f), `SOCIAL_FIELDS asks Mongo for "${f}"`);
  }
});

test("scores tolerate a missing or empty history", () => {
  assert.equal(weeklyScore(), 0);
  assert.equal(todayScore(), 0);
  assert.equal(toFriendView({}).username, "");
  assert.equal(toFriendView({}).avatarEmoji, "🧘", "falls back rather than rendering blank");
});

test("weekly score ignores days older than a week", () => {
  const old = new Date(); old.setDate(old.getDate() - 30);
  const recent = new Date(); recent.setDate(recent.getDate() - 2);
  const total = weeklyScore([
    { date: old.toISOString().slice(0, 10), score: 100 },
    { date: recent.toISOString().slice(0, 10), score: 40 },
  ]);
  assert.equal(total, 40, "a month-old score must not inflate this week");
});

// Usernames reach a Mongo query and a public URL. Rejecting anything outside
// [a-z0-9_] is what keeps regex metacharacters and NoSQL operators out.
test("username validation rejects the payloads that made search dangerous", () => {
  const attacks = [
    ".*",              // matched every user — dumped the user list
    ".",               // same
    "(a+)+$",          // catastrophic backtracking, pins the CPU
    "^admin",          // anchor injection
    "a|b",             // alternation
    "[a-z]",           // character class
    "../../etc/passwd",// path traversal in the /u/ URL
    "<script>",        // markup into a public page
    "ab",              // too short
    "a".repeat(21),    // too long
    "Wriya",           // uppercase — usernames are lowercased before lookup
    "has space",
    "",
  ];
  for (const a of attacks) {
    assert.equal(isValidUsername(a), false, `must reject ${JSON.stringify(a)}`);
  }
});

test("username validation rejects non-strings (NoSQL operator objects)", () => {
  // ?q[$ne]=x arrives as an object; it must never reach the query.
  for (const v of [{ $ne: "x" }, ["a"], null, undefined, 42, true]) {
    assert.equal(isValidUsername(v), false, `must reject ${JSON.stringify(v)}`);
  }
});

test("username validation accepts ordinary usernames", () => {
  for (const ok of ["wriya", "sanika_21", "abc", "a_1", "z".repeat(20)]) {
    assert.equal(isValidUsername(ok), true, `must accept ${ok}`);
  }
});
