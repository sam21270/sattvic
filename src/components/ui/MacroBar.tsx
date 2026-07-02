import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
  decimals?: number;
}

export function MacroBar({ label, value, max, color, unit = "g", decimals = 0 }: MacroBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : n;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="text-zinc-100 font-semibold">
          {fmt(value)}{unit} / {fmt(max)}{unit}
        </span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
