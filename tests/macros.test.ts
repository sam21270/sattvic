// Run with `npm test`. calculateMacros calls .toLowerCase() on gender,
// activityLevel and goal, so anything that is not a string crashes it. The
// route rejects those before they get here; these pin the contract that makes
// that rejection necessary, plus the arithmetic that would break silently.
import { test } from "node:test";
import assert from "node:assert/strict";

// groq.ts builds a Groq client at module load, which throws without a key.
// calculateMacros is pure arithmetic and never calls it, so a placeholder is
// enough to import the module. Dynamic import so this runs before the import.
process.env.GROQ_API_KEY ??= "placeholder-not-used-by-calculateMacros";
const { calculateMacros } = await import("../src/lib/ai/groq.ts");

const input = {
  weight: 70, height: 175, age: 30,
  gender: "male", activityLevel: "moderately active", goal: "maintain",
};

test("a valid input produces sane calories and macros", () => {
  const m = calculateMacros(input);
  assert.ok(m.calories > 1500 && m.calories < 4000, `calories out of range: ${m.calories}`);
  for (const [k, v] of Object.entries({ protein: m.protein, carbs: m.carbs, fat: m.fat })) {
    assert.ok(typeof v === "number" && v > 0, `${k} should be a positive number`);
  }
});

test("losing weight never drops below the safe intake floor", () => {
  const m = calculateMacros({
    ...input, weight: 45, height: 150, age: 60, gender: "female",
    activityLevel: "sedentary", goal: "lose weight", pace: "aggressive" as const,
  });
  assert.ok(m.calories >= 1200, `female floor breached: ${m.calories}`);
});

test("an unrecognised activity level falls back instead of throwing", () => {
  const m = calculateMacros({ ...input, activityLevel: "wombat" });
  assert.ok(m.calories > 0, "should fall back to the default multiplier");
});

test("a non-string gender/activityLevel/goal throws — the route must reject it first", () => {
  for (const bad of [{ gender: 5 }, { activityLevel: null }, { goal: { a: 1 } }]) {
    assert.throws(
      () => calculateMacros({ ...input, ...bad } as never),
      TypeError,
      `expected ${JSON.stringify(bad)} to throw`,
    );
  }
});
