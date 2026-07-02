export interface Meal {
  _id?: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  prepTime: number;
  ingredients: string[];
  instructions?: string[];
  tags: string[];
  image?: string;
  videoUrl?: string;
  sourceUrl?: string;
  isHighProtein: boolean;
  isLowCarb: boolean;
}

export interface MealPlan {
  _id?: string;
  userId: string;
  week: string; // ISO date of week start
  days: {
    date: string;
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
    snacks?: Meal[];
  }[];
  createdAt?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  explanation?: string;
}

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  macroTargets?: MacroTargets;
}
