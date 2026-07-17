"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "your Dashboard",
  "/meal-planner": "your Meal Plan",
  "/recipes": "Recipes",
  "/macros": "the Macro Calculator",
  "/dosha": "the Dosha Quiz",
  "/fridge": "My Fridge",
  "/junk": "Healthy Junk",
  "/workout": "Workout Tracker",
  "/progress": "Progress",
};

// Remembers the last page visited; on returning to the homepage,
// offers to continue where the user left off.
export function ResumeBanner() {
  const pathname = usePathname();
  const [resume, setResume] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pathname === "/") {
      const last = localStorage.getItem("sattvic-last-page");
      if (last && PAGE_NAMES[last]) setResume(last);
    } else if (PAGE_NAMES[pathname]) {
      localStorage.setItem("sattvic-last-page", pathname);
      setResume(null);
    }
  }, [pathname]);

  if (!resume || dismissed || pathname !== "/") return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[150] flex items-center gap-3 bg-[#141414] border border-emerald-500/30 rounded-2xl pl-4 sm:pl-5 pr-2 sm:pr-3 py-3 shadow-2xl shadow-black/50 sm:w-max">
      <p className="text-sm text-zinc-300 shrink-0 hidden sm:block">
        Pick up where you left off?
      </p>
      <Link
        href={resume}
        className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex-1 sm:flex-initial whitespace-nowrap"
      >
        <span className="sm:hidden">Continue to </span>{PAGE_NAMES[resume]} <ArrowRight className="w-3.5 h-3.5 shrink-0" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-zinc-600 hover:text-zinc-300 transition-colors p-2 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
