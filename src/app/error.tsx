"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

// Shown instead of a white screen when a page throws.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Something went wrong on our side</h1>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
            Your meal plans and logs are saved on this device — nothing is lost. Try again, and if it keeps
            happening, head back to the dashboard.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
