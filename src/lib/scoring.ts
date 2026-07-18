export interface DayLog {
  date: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  b12: number;   // micrograms
  iron: number;  // milligrams
  mealsLogged: number;
  dosha?: "Vata" | "Pitta" | "Kapha";
}

export interface ScoreBreakdown {
  total: number;
  grade: "S" | "A" | "B" | "C" | "D";
  calorie: number;   // max 25
  protein: number;   // max 30
  balance: number;   // max 20 (meals logged)
  dosha: number;     // max 15
  streak: number;    // max 10
  hasDosha: boolean; // false → dosha excluded, score rescaled out of 85
  label: string;
  color: string;
}

export interface HistoryEntry {
  date: string;
  score: number;
  grade: string;
}

export interface ScoreTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const TARGETS: ScoreTargets = {
  calories: 2000,
  protein: 120,
  carbs: 200,
  fat: 65,
  fiber: 30,
};

function scoreCalories(actual: number, target: number): number {
  const pct = actual / target;
  if (pct >= 0.9 && pct <= 1.05) return 25;
  if (pct >= 0.8 && pct <= 1.15) return 18;
  if (pct >= 0.65 && pct <= 1.25) return 10;
  return 4;
}

function scoreProtein(actual: number, target: number): number {
  const pct = actual / target;
  if (pct >= 0.95) return 30;
  if (pct >= 0.8) return 22;
  if (pct >= 0.65) return 14;
  if (pct >= 0.5) return 7;
  return 2;
}

function scoreMeals(mealsLogged: number): number {
  return [0, 6, 13, 20][Math.min(mealsLogged, 3)];
}

function scoreDosha(log: DayLog): number {
  if (!log.dosha) return 8; // neutral if no dosha set
  // Simple heuristic per dosha
  if (log.dosha === "Vata") {
    // Vata needs warm, grounding foods — higher protein & fat is good
    const good = log.protein >= 80 && log.fat >= 40;
    return good ? 15 : 8;
  }
  if (log.dosha === "Pitta") {
    // Pitta needs cooling — moderate calories, high fiber
    const good = log.calories <= 2100 && log.fiber >= 20;
    return good ? 15 : 8;
  }
  if (log.dosha === "Kapha") {
    // Kapha needs light — lower carbs, high protein
    const good = log.carbs <= 160 && log.protein >= 100;
    return good ? 15 : 8;
  }
  return 8;
}

function scoreStreak(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;
  let streak = 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  for (const entry of sorted) {
    if (entry.score >= 50) streak++;
    else break;
  }
  if (streak >= 7) return 10;
  if (streak >= 4) return 7;
  if (streak >= 2) return 4;
  if (streak >= 1) return 2;
  return 0;
}

function getGrade(score: number): "S" | "A" | "B" | "C" | "D" {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

function getLabel(score: number): string {
  if (score >= 90) return "Perfectly Sattvic";
  if (score >= 75) return "On track";
  if (score >= 55) return "Getting there";
  if (score >= 35) return "Needs work";
  return "Off track today";
}

function getColor(grade: string): string {
  return { S: "#059669", A: "#10b981", B: "#f59e0b", C: "#f97316", D: "#ef4444" }[grade] ?? "#10b981";
}

export function calculateScore(log: DayLog, history: HistoryEntry[] = [], targets: ScoreTargets = TARGETS): ScoreBreakdown {
  // No meals logged yet — don't show a fake score
  const hasDosha = !!log.dosha;
  if (log.mealsLogged === 0) {
    const streak = scoreStreak(history);
    return { total: 0, grade: "D", calorie: 0, protein: 0, balance: 0, dosha: 0, streak, hasDosha, label: "Log your first meal", color: getColor("D") };
  }
  const calorie = scoreCalories(log.calories, targets.calories);
  const protein = scoreProtein(log.protein, targets.protein);
  const balance = scoreMeals(log.mealsLogged);
  const dosha   = hasDosha ? scoreDosha(log) : 0;
  const streak  = scoreStreak(history);
  // Dosha is an optional add-on: without it, rescale the other 85 points to 100
  // so skipping the quiz never caps your grade.
  const raw     = calorie + protein + balance + streak + dosha;
  const total   = Math.min(Math.round(hasDosha ? raw : (raw / 85) * 100), 100);
  const grade   = getGrade(total);
  return { total, grade, calorie, protein, balance, dosha, streak, hasDosha, label: getLabel(total), color: getColor(grade) };
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("sattvic_history") ?? "[]"); } catch { return []; }
}

export function saveToHistory(score: number, grade: string) {
  if (typeof window === "undefined") return;
  const history = loadHistory();
  const today = getTodayKey();
  const filtered = history.filter((h) => h.date !== today);
  filtered.push({ date: today, score, grade });
  const last30 = filtered.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  localStorage.setItem("sattvic_history", JSON.stringify(last30));
}
