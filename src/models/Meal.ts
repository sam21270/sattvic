import mongoose, { Schema, Document } from "mongoose";

export interface IMeal extends Document {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  image?: string;
  isHighProtein: boolean;
  isLowCarb: boolean;
}

const MealSchema = new Schema<IMeal>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number, default: 0 },
    prepTime: { type: Number, required: true },
    ingredients: [{ type: String }],
    instructions: [{ type: String }],
    tags: [{ type: String }],
    image: { type: String },
    isHighProtein: { type: Boolean, default: false },
    isLowCarb: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MealSchema.index({ isHighProtein: 1, isLowCarb: 1 });
MealSchema.index({ tags: 1 });

export const Meal = mongoose.models.Meal || mongoose.model<IMeal>("Meal", MealSchema);
