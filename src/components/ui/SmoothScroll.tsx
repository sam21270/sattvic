"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisInstance = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // keep scroll limits in sync when content height changes without a
    // route change (e.g. generating a meal plan, opening an accordion) —
    // Lenis only auto-resizes on window resize events otherwise.
    const ro = new ResizeObserver(() => lenis.resize());
    ro.observe(document.body);

    return () => {
      ro.disconnect();
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

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
