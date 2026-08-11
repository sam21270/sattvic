// Run with `npm test` (node:test + --experimental-strip-types, no test framework).
// These cover the rules that would break silently: the no-meals guard, the
// dosha rescale, the 100 cap, streak continuity, and the 4am day rollover.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateScore, currentStreak, dayKey, type DayLog, type HistoryEntry } from "../src/lib/scoring.ts";
import { doshaScoreAdjustment, isMealGoodForDosha } from "../src/lib/doshaRules.ts";
import { dishQuery } from "../src/lib/utils.ts";

const day = (over: Partial<DayLog> = {}): DayLog => ({
  date: "2026-07-30", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  b12: 0, iron: 0, mealsLogged: 0, ...over,
});

/* ── the no-meals guard ─────────────────────────────────────────
   An unlogged day must read as zero, not as a flattering low score. */
test("no meals logged scores 0 and says so", () => {
  const s = calculateScore(day({ mealsLogged: 0, calories: 2000, protein: 120 }));
  assert.equal(s.total, 0, "generous macros must not earn points without a logged meal");
  assert.equal(s.label, "Log your first meal");
  assert.equal(s.grade, "D");
});

/* ── dosha is optional, never a penalty ─────────────────────────
   Skipping the quiz rescales the other 85 points to 100. If this breaks,
   users who skip the quiz get silently capped at a B. */
test("skipping the dosha quiz does not cap the grade", () => {
  const macros = { calories: 2000, protein: 120, carbs: 200, fat: 65, fiber: 30, mealsLogged: 3 };
  const withoutDosha = calculateScore(day(macros));
  const withDosha = calculateScore(day({ ...macros, dosha: "Vata" }));

  assert.equal(withoutDosha.dosha, 0, "no dosha means no dosha points");
  assert.equal(withoutDosha.hasDosha, false);
  // 25 cal + 30 protein + 20 meals + 0 streak = 75 raw -> 75/85*100 = 88
  assert.equal(withoutDosha.total, 88);
  assert.equal(withoutDosha.grade, "A", "a perfect macro day must not grade below A");
  assert.ok(withDosha.total >= withoutDosha.total - 1, "taking the quiz should never hurt");
});

test("score never exceeds 100", () => {
  const history: HistoryEntry[] = Array.from({ length: 10 }, (_, i) => ({
    date: dayKey(i), score: 90, grade: "S",
  }));
  const s = calculateScore(
    day({ calories: 2000, protein: 200, carbs: 150, fat: 65, fiber: 40, mealsLogged: 9, dosha: "Kapha" }),
    history,
  );
  assert.ok(s.total <= 100, `capped at 100, got ${s.total}`);
});

test("grade thresholds hold at their boundaries", () => {
  // graded off `total`, so drive it via macros and assert the mapping
  const perfect = calculateScore(day({ calories: 2000, protein: 120, carbs: 200, fat: 65, fiber: 30, mealsLogged: 3, dosha: "Pitta" }));
  assert.equal(perfect.grade, "S", `90+ is S, got ${perfect.total}`);
  const poor = calculateScore(day({ calories: 600, protein: 10, carbs: 40, fat: 5, fiber: 2, mealsLogged: 1 }));
  assert.ok(["C", "D"].includes(poor.grade), `a bad day grades C or D, got ${poor.grade}`);
});

/* ── streak continuity ──────────────────────────────────────────
   Only days scoring >= 50 count, they must be consecutive, and a day
   not yet logged must not break the run. */
test("streak counts consecutive good days and tolerates an unlogged today", () => {
  const good = (n: number) => ({ date: dayKey(n), score: 60, grade: "B" });

  assert.equal(currentStreak([good(0), good(1), good(2)]), 3);
  assert.equal(currentStreak([good(1), good(2)]), 2, "today unlogged should still count yesterday's run");
  assert.equal(currentStreak([good(0), good(2)]), 1, "a gap ends the streak");
  assert.equal(currentStreak([]), 0);
});

test("a bad day breaks the streak", () => {
  const history: HistoryEntry[] = [
    { date: dayKey(0), score: 60, grade: "B" },
    { date: dayKey(1), score: 40, grade: "C" }, // below 50 — not a good day
    { date: dayKey(2), score: 80, grade: "A" },
  ];
  assert.equal(currentStreak(history), 1);
});

/* ── the 4am rollover ───────────────────────────────────────────
   A 1am snack belongs to the previous evening. Keys are local, never UTC. */
test("dayKey rolls over at 4am local, not midnight", () => {
  const at1am = new Date(2026, 6, 30, 1, 30);
  const at5am = new Date(2026, 6, 30, 5, 30);
  assert.equal(dayKey(at1am), "2026-07-29", "1:30am belongs to the previous day");
  assert.equal(dayKey(at5am), "2026-07-30", "5:30am is the new day");
});

test("dayKey pads months and days to two digits", () => {
  assert.match(dayKey(new Date(2026, 0, 5, 12)), /^\d{4}-01-05$/);
});

/* ── dosha meal matching ────────────────────────────────────────
   Adjustment is a sort weight: negative ranks a meal higher. */
test("dosha adjustment favours matching meals and penalises clashing ones", () => {
  assert.equal(doshaScoreAdjustment("anything", ["warm"], null), 0, "no dosha set means no adjustment");
  const good = doshaScoreAdjustment("Khichdi", ["warm"], "Vata");
  assert.ok(good < 0, `a matching meal should rank higher (negative), got ${good}`);
  assert.equal(doshaScoreAdjustment("anything", [], "NotADosha"), 0, "unknown dosha is ignored, not thrown");
});

test("isMealGoodForDosha is case-insensitive and safe without a dosha", () => {
  assert.equal(isMealGoodForDosha("Khichdi", [], null), false);
  assert.equal(
    isMealGoodForDosha("KHICHDI", [], "vata"),
    isMealGoodForDosha("khichdi", [], "Vata"),
    "casing of meal name and dosha must not change the answer",
  );
});

/* ── linking a suggestion to a recipe ──────────────────────────── */

test("a meal suggestion becomes a searchable dish name", () => {
  // The exact strings the dashboard suggests.
  assert.equal(dishQuery("2 cups dal makhani"), "dal makhani");
  assert.equal(dishQuery("1 cup cooked chana masala + 2 rotis"), "chana masala");
  assert.equal(dishQuery("1 cup Greek yogurt + 1/2 cup almonds + 1 cup mixed veggies"), "Greek yogurt");
  assert.equal(dishQuery("1/2 katori rajma"), "rajma");
  // Already clean, and not mangled.
  assert.equal(dishQuery("Paneer Butter Masala"), "Paneer Butter Masala");
});
