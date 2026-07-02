import { Clock, Zap, Dumbbell, Wheat } from "lucide-react";
import { Meal } from "@/types";
import { cn } from "@/lib/utils";

interface MealCardProps {
  meal: Meal;
  onSelect?: (meal: Meal) => void;
  className?: string;
}

export function MealCard({ meal, onSelect, className }: MealCardProps) {
  return (
    <div
      className={cn(
        "bg-[#141414] rounded-2xl border border-white/[0.1] overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
        className
      )}
      onClick={() => onSelect?.(meal)}
    >
      {meal.image ? (
        <img src={meal.image} alt={meal.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
          <span className="text-4xl">🥗</span>
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-zinc-100 leading-tight">{meal.name}</h3>
            <div className="flex gap-1 shrink-0">
              {meal.isHighProtein && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  High Protein
                </span>
              )}
              {meal.isLowCarb && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Low Carb
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{meal.description}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 pt-1">
          <MacroChip icon={<Zap className="w-3 h-3" />} value={meal.calories} label="kcal" color="text-orange-600" />
          <MacroChip icon={<Dumbbell className="w-3 h-3" />} value={meal.protein} label="P" color="text-blue-600" />
          <MacroChip icon={<Wheat className="w-3 h-3" />} value={meal.carbs} label="C" color="text-amber-600" />
          <MacroChip icon={<span className="text-xs font-bold">F</span>} value={meal.fat} label="F" color="text-rose-600" />
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-600">
          <Clock className="w-3 h-3" />
          <span>{meal.prepTime} min</span>
        </div>
      </div>
    </div>
  );
}

function MacroChip({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center bg-white/[0.03] rounded-xl py-1.5 px-1">
      <span className={cn("flex items-center", color)}>{icon}</span>
      <span className="text-xs font-semibold text-zinc-200">{value}g</span>
      <span className="text-[10px] text-zinc-600">{label}</span>
    </div>
  );
}
