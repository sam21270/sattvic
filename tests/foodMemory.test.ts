// The point of food memory is that a correction sticks and a wrong correction
// can be taken back. Both are one localStorage blob, so both get a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalisePhrase, memoryKey, recallMacros, rememberMacros, forgetMacros } from "../src/lib/foodMemory.ts";

function withLocalStorage(run: () => void) {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
    },
  };
  try { run(); } finally { delete (globalThis as any).window; }
}

const HASHBROWNS = { calories: 210, protein: 3, carbs: 28, fat: 10 };

test("spacing and punctuation don't fork an entry", () => {
  // The bug this exists for: the model calls it "3 hashbrowns" one day and
  // "3 hash-brown patties" is what the user typed the next.
  assert.equal(normalisePhrase("3 hash-browns"), normalisePhrase("3 hash browns"));
  assert.equal(normalisePhrase("3 Hashbrowns"), "3hashbrowns");
});

test("a correction is used the next time the same food is logged", () => {
  withLocalStorage(() => {
    rememberMacros("3 hash browns", HASHBROWNS);
    assert.deepEqual(recallMacros("3 Hash-Browns"), HASHBROWNS);
  });
});

test("a different quantity is a different food", () => {
  // Deliberate: nothing is scaled by count, so "5 rotis" must not inherit
  // "2 rotis" numbers.
  withLocalStorage(() => {
    rememberMacros("2 rotis", { calories: 160, protein: 6, carbs: 32, fat: 1 });
    assert.equal(recallMacros("5 rotis"), null);
  });
});

test("a count the model dropped from the name still separates the entries", () => {
  // Observed live: "3 hash browns" came back named just "hash browns". Keyed on
  // that alone, a correction made for 3 would be served for 5.
  assert.notEqual(
    memoryKey("hash browns", "3 hash browns", 0),
    memoryKey("hash browns", "5 hash browns", 0),
  );
  assert.equal(memoryKey("hash browns", "3 hash browns", 0), "3hashbrowns");
});

test("a count the model did write is used as-is", () => {
  // No borrowing when the name already carries the quantity — otherwise the
  // text's count would be glued on twice.
  assert.equal(memoryKey("2 rotis", "2 rotis, 1 cup rice", 0), "2rotis");
});

test("each item borrows the count from its own part of the phrase", () => {
  assert.equal(memoryKey("rice", "3 hash browns, 1 cup rice", 1), "1rice");
});

test("undo stops the saved numbers being reused", () => {
  withLocalStorage(() => {
    rememberMacros("3 hash browns", HASHBROWNS);
    forgetMacros("3 hash browns");
    assert.equal(recallMacros("3 hash browns"), null);
  });
});

test("nothing is remembered before anything is corrected", () => {
  withLocalStorage(() => {
    assert.equal(recallMacros("1 cup rice"), null);
  });
});
