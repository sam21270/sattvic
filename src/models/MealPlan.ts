import mongoose, { Schema, Document } from "mongoose";

const DaySchema = new Schema({
  date: { type: String, required: true },
  breakfast: { type: Schema.Types.ObjectId, ref: "Meal" },
  lunch: { type: Schema.Types.ObjectId, ref: "Meal" },
  dinner: { type: Schema.Types.ObjectId, ref: "Meal" },
  snacks: [{ type: Schema.Types.ObjectId, ref: "Meal" }],
});

export interface IMealPlan extends Document {
  userId: string;
  week: string;
  days: typeof DaySchema[];
}

const MealPlanSchema = new Schema<IMealPlan>(
  {
    userId: { type: String, required: true },
    week: { type: String, required: true },
    days: [DaySchema],
  },
  { timestamps: true }
);

MealPlanSchema.index({ userId: 1, week: 1 }, { unique: true });

export const MealPlan =
  mongoose.models.MealPlan || mongoose.model<IMealPlan>("MealPlan", MealPlanSchema);
