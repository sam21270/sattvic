// The point of food memory is that a correction sticks and a wrong correction
// can be taken back. Both are one localStorage blob, so both get a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalisePhrase, memoryKeys, recallMacros, rememberMacros, forgetMacros } from "../src/lib/foodMemory.ts";

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

test("the model renaming the same food does not lose the entry", () => {
  // Observed live, same phrase on consecutive calls: "3 hash browns" was named
  // "hash browns" once and "3 hash browns" the next; a tea gained a "(1 cup)"
  // suffix. Keyed on the model's name, a saved correction goes missing at
  // random. What the user typed does not move.
  assert.deepEqual(
    memoryKeys([{ name: "hash browns" }], "3 hash browns"),
    memoryKeys([{ name: "3 hash browns (3 patties)" }], "3 hash browns"),
  );
});

test("a different quantity typed is a different entry", () => {
  assert.notDeepEqual(
    memoryKeys([{ name: "hash browns" }], "3 hash browns"),
    memoryKeys([{ name: "hash browns" }], "5 hash browns"),
  );
});

test("two versions of one drink are told apart by what was typed", () => {
  // The user's own case: same tea, 1% milk some days and 6% others. The model
  // may well call both "masala tea"; the phrase is what separates them.
  const [a] = memoryKeys([{ name: "masala tea" }], "masala tea with 150ml 1% milk");
  const [b] = memoryKeys([{ name: "masala tea" }], "masala tea with 150ml 6% milk");
  assert.notEqual(a, b);
});

test("each item is keyed on its own part of the phrase", () => {
  assert.deepEqual(
    memoryKeys([{ name: "3 hash browns" }, { name: "1 cup cooked rice" }], "3 hash browns, 1 cup rice"),
    ["3hashbrowns", "1cuprice"],
  );
});

test("two foods out of one typed segment never share an entry", () => {
  // "2 rotis and dal" is one comma segment but two items. Sharing a key would
  // have the second overwrite the first, then serve dal's numbers for roti.
  const keys = memoryKeys([{ name: "2 rotis" }, { name: "1 katori dal" }], "2 rotis and dal");
  assert.notEqual(keys[0], keys[1]);
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
