export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  color: string;
}

export const ALL_BADGES: Badge[] = [
  { id: "first_meal",    emoji: "🍽️", name: "First Bite",       description: "Logged your first meal",              color: "bg-amber-50 border-amber-200 text-amber-700"   },
  { id: "dosha_found",   emoji: "🌿", name: "Self Aware",       description: "Discovered your Ayurvedic dosha",     color: "bg-emerald-50 border-emerald-200 text-emerald-700"},
  { id: "streak_3",      emoji: "🔥", name: "3-Day Streak",     description: "Stayed consistent for 3 days",        color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "streak_7",      emoji: "⚡", name: "Week Warrior",     description: "7 days of tracking in a row",         color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { id: "streak_30",     emoji: "👑", name: "Monthly Master",   description: "30-day unbroken streak",              color: "bg-violet-50 border-violet-200 text-violet-700" },
  { id: "score_80",      emoji: "✨", name: "Sattvic Day",      description: "Hit a Sattvic Score of 80+",          color: "bg-teal-50 border-teal-200 text-teal-700"       },
  { id: "score_100",     emoji: "💎", name: "Perfect Day",      description: "Achieved a perfect score of 100",     color: "bg-blue-50 border-blue-200 text-blue-700"       },
  { id: "protein_5",     emoji: "💪", name: "Protein Pro",      description: "Hit protein goal 5 days running",     color: "bg-rose-50 border-rose-200 text-rose-700"       },
  { id: "fridge_chef",   emoji: "🧊", name: "Fridge Chef",      description: "Used What's in My Fridge? feature",   color: "bg-cyan-50 border-cyan-200 text-cyan-700"       },
  { id: "macro_master",  emoji: "🎯", name: "Macro Master",     description: "Calculated your personal macros",     color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { id: "shield_used",   emoji: "🛡️", name: "Shielded",         description: "Used your streak shield",             color: "bg-stone-50 border-stone-200 text-stone-700"    },
  { id: "week_planned",  emoji: "📅", name: "Planner",          description: "Generated your first weekly meal plan",color: "bg-lime-50 border-lime-200 text-lime-700"       },
];

export function getBadge(id: string): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

export function checkNewBadges(
  existing: string[],
  ctx: {
    mealsLoggedToday: number;
    doshaSet: boolean;
    streak: number;
    score: number;
    proteinStreak: number;
    usedFridge: boolean;
    calculatedMacros: boolean;
    usedShield: boolean;
    weekPlanned: boolean;
  }
): string[] {
  const earned: string[] = [];
  const add = (id: string) => { if (!existing.includes(id) && !earned.includes(id)) earned.push(id); };

  if (ctx.mealsLoggedToday >= 1)  add("first_meal");
  if (ctx.doshaSet)                add("dosha_found");
  if (ctx.streak >= 3)             add("streak_3");
  if (ctx.streak >= 7)             add("streak_7");
  if (ctx.streak >= 30)            add("streak_30");
  if (ctx.score >= 80)             add("score_80");
  if (ctx.score >= 100)            add("score_100");
  if (ctx.proteinStreak >= 5)      add("protein_5");
  if (ctx.usedFridge)              add("fridge_chef");
  if (ctx.calculatedMacros)        add("macro_master");
  if (ctx.usedShield)              add("shield_used");
  if (ctx.weekPlanned)             add("week_planned");

  return earned;
}
