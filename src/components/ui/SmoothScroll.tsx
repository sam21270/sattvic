"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Native scroll is smoother on touch devices — Lenis's RAF loop only adds
    // jank and fights momentum scrolling on phones. Desktop keeps the smooth feel.
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    // The landing page drives its pinned phone stage and week rail off real
    // scroll position; Lenis's inertia lags those pins behind the pointer.
    if (pathname === "/") return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisInstance = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // keep scroll limits in sync when content height changes without a
    // route change (e.g. generating a meal plan, opening an accordion) —
    // Lenis only auto-resizes on window resize events otherwise.
    const ro = new ResizeObserver(() => lenis.resize());
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      lenis.destroy();
      lenisInstance = null;
    };
  }, [pathname]);

  // resync scroll limits + jump to top on every client-side route change,
  // otherwise Lenis keeps the previous page's cached scroll height and can
  // appear to "stop scrolling" on pages shorter or taller than the last one.
  useEffect(() => {
    if (!lenisInstance) return;
    lenisInstance.resize();
    lenisInstance.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
