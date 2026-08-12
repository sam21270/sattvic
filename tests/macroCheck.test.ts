// Run with `npm test`. The numbers here are the ones the model actually
// returned in production, not invented examples.
import { test } from "node:test";
import assert from "node:assert/strict";
import { impliedCalories, isConsistent, inconsistentItems, reconcile, sumFromIngredients } from "../src/lib/ai/macroCheck.ts";

// What "2 boiled eggs white part only" came back as: whole-egg calories kept,
// protein roughly quadrupled, and the two not reconcilable with each other.
const eggWhites = { name: "2 boiled eggs white part only", calories: 140, protein: 26, carbs: 0, fat: 0 };
// Whole eggs, which the model got right — this must not be flagged.
const wholeEggs = { name: "2 boiled eggs", calories: 140, protein: 12, carbs: 0, fat: 10 };

test("calories are derived from the macros", () => {
  assert.equal(impliedCalories({ protein: 26, carbs: 0, fat: 0 }), 104);
  assert.equal(impliedCalories({ protein: 12, carbs: 0, fat: 10 }), 138);
});

test("catches the egg-white answer and leaves the whole-egg one alone", () => {
  assert.equal(isConsistent(eggWhites), false, "140 kcal from 26g protein alone is impossible");
  assert.equal(isConsistent(wholeEggs), true, "138 vs 140 is rounding, not an error");
});

test("normal rounding does not trip the check", () => {
  // 1 roti: 104 implied vs 100 stated.
  assert.equal(isConsistent({ calories: 100, protein: 3, carbs: 20, fat: 1 }), true);
  // An empty item is consistent with itself rather than a divide-by-zero.
  assert.equal(isConsistent({ calories: 0, protein: 0, carbs: 0, fat: 0 }), true);
});

test("a wrong answer in the other direction is caught too", () => {
  // Understated calories, e.g. fat ignored.
  assert.equal(isConsistent({ calories: 90, protein: 5, carbs: 5, fat: 20 }), false);
});

test("the feedback names the item and shows both numbers", () => {
  const msgs = inconsistentItems([eggWhites, wholeEggs]);
  assert.equal(msgs.length, 1, "only the impossible item should be reported");
  assert.match(msgs[0], /2 boiled eggs white part only/);
  assert.match(msgs[0], /140 kcal/);
  assert.match(msgs[0], /104 kcal/);
});

test("reconcile makes the calories match the macros, and leaves good items untouched", () => {
  assert.equal(reconcile(eggWhites).calories, 104);
  assert.equal(reconcile(wholeEggs), wholeEggs, "a consistent item is returned as-is");
});

/* ── an item must equal its ingredients ────────────────────────── */

test("an item's macros are recomputed from its ingredients", () => {
  // The real "3 hash brown patties" response: 390 stated, 300 in the parts.
  const item = {
    name: "3 hash brown patties", calories: 390, protein: 6, carbs: 48, fat: 18, fiber: 4,
    keyIngredients: [
      { name: "potatoes", calories: 180, protein: 4, carbs: 40, fat: 0, fiber: 4 },
      { name: "oil", calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0 },
    ],
  };
  const fixed = sumFromIngredients(item);
  assert.equal(fixed.calories, 300, "should equal the parts, not the model's total");
  assert.equal(fixed.fat, 14);
  assert.equal(fixed.protein, 4);
});

test("an item with no ingredients is left alone", () => {
  const packaged = { name: "1 banana", calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 };
  assert.equal(sumFromIngredients(packaged), packaged);
});
