import Link from "next/link";
import { Home, CalendarDays, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <p className="text-5xl font-black text-white tracking-tight">404</p>
          <h1 className="text-xl font-bold text-white mt-2">This page isn&apos;t on the menu</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            The link may be old or mistyped. Everything else is still where you left it.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            href="/meal-planner"
            className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            <CalendarDays className="w-4 h-4" /> Meal Planner
          </Link>
        </div>
      </div>
    </div>
  );
}
