// Estimated B12 (mcg) and Iron (mg) per serving for key vegetarian meals.
// B12 daily target: 2.4 mcg | Iron daily target: 18 mg (women) / 8 mg (men) — using 18 as default.
// Values based on USDA/NIH food composition data for standard vegetarian ingredients.

export const DAILY_B12_MCG = 2.4;
export const DAILY_IRON_MG = 18;

interface MicroEntry { b12: number; iron: number }

// Partial lookup — keyed by lowercase meal name substring.
// We do a "includes" check so "Palak Paneer with Roti" matches "palak paneer".
const MICRO_BY_NAME: { key: string; b12: number; iron: number }[] = [
  // Dairy-rich (good B12 source)
  { key: "greek yogurt",          b12: 1.4, iron: 0.2 },
  { key: "yogurt",                b12: 1.0, iron: 0.1 },
  { key: "cottage cheese",        b12: 0.9, iron: 0.3 },
  { key: "paneer",                b12: 0.7, iron: 0.5 },
  { key: "paneer bhurji",         b12: 0.8, iron: 0.6 },
  { key: "matar paneer",         b12: 0.7, iron: 2.2 },
  { key: "palak paneer",          b12: 0.7, iron: 4.5 },
  { key: "paneer tikka",          b12: 0.8, iron: 0.6 },
  { key: "shakshuka",             b12: 1.0, iron: 2.0 },
  { key: "menemen",               b12: 1.0, iron: 1.8 },
  { key: "omelette",              b12: 1.2, iron: 1.5 },
  { key: "egg white",             b12: 0.3, iron: 0.3 },
  { key: "ful medames",           b12: 0.0, iron: 4.8 },

  // Legume-rich (good iron source)
  { key: "dal tadka",             b12: 0.1, iron: 5.5 },
  { key: "dal fry",               b12: 0.1, iron: 5.2 },
  { key: "rajma",                 b12: 0.0, iron: 5.2 },
  { key: "chana masala",          b12: 0.0, iron: 4.8 },
  { key: "chickpea",              b12: 0.0, iron: 4.2 },
  { key: "black bean",            b12: 0.0, iron: 3.6 },
  { key: "lentil",                b12: 0.0, iron: 6.6 },
  { key: "smoky lentil",          b12: 0.0, iron: 6.0 },

  // Tofu/soy
  { key: "tofu",                  b12: 0.0, iron: 3.0 },
  { key: "kung pao tofu",         b12: 0.0, iron: 3.2 },
  { key: "pad thai",              b12: 0.0, iron: 2.8 },
  { key: "edamame",               b12: 0.0, iron: 2.3 },

  // Spinach/leafy
  { key: "spinach",               b12: 0.0, iron: 3.6 },
  { key: "saag",                  b12: 0.0, iron: 4.0 },

  // Quinoa/seeds
  { key: "quinoa",                b12: 0.0, iron: 2.8 },
  { key: "chia",                  b12: 0.0, iron: 2.1 },

  // Oats
  { key: "oats",                  b12: 0.0, iron: 2.1 },
  { key: "masala oats",           b12: 0.0, iron: 2.4 },
  { key: "overnight oats",        b12: 0.1, iron: 2.1 },

  // Fortified/dairy smoothies
  { key: "protein smoothie",      b12: 0.8, iron: 1.5 },
  { key: "whey",                  b12: 0.4, iron: 0.3 },

  // Indian mains
  { key: "rajma chawal",          b12: 0.0, iron: 5.4 },
  { key: "khichdi",               b12: 0.0, iron: 4.0 },
  { key: "chole",                 b12: 0.0, iron: 4.8 },
  { key: "sambar",                b12: 0.0, iron: 3.5 },
  { key: "dal makhani",           b12: 0.1, iron: 5.8 },

  // Besan
  { key: "besan chilla",          b12: 0.0, iron: 2.8 },

  // Mediterranean
  { key: "hummus",                b12: 0.0, iron: 1.8 },
  { key: "falafel",               b12: 0.0, iron: 3.2 },
  { key: "ratatouille",           b12: 0.0, iron: 1.5 },
  { key: "pisto",                 b12: 0.0, iron: 1.4 },
];

// Default estimate for meals not in the lookup
const DEFAULT: MicroEntry = { b12: 0.1, iron: 1.5 };

export function getMicros(mealName: string): MicroEntry {
  const lower = mealName.toLowerCase();
  // Use the most specific match (longest key that matches)
  const matches = MICRO_BY_NAME.filter((e) => lower.includes(e.key));
  if (matches.length === 0) return DEFAULT;
  return matches.reduce((best, cur) => (cur.key.length > best.key.length ? cur : best), matches[0]);
}
