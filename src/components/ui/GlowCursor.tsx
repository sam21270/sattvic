"use client";

import { useEffect, useRef, useState } from "react";

// Emerald glow cursor: a crisp dot that tracks instantly plus a soft ring
// that lags behind with spring-like easing. Ring expands over interactive
// elements. Desktop-pointer only; respects prefers-reduced-motion.
export function GlowCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;
    setEnabled(true);

    const pos = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let hovering = false;
    let raf = 0;

    function onMove(e: PointerEvent) {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const target = e.target as HTMLElement | null;
      hovering = !!target?.closest("a, button, [role='button'], input, select, textarea, label");
    }

    function tick() {
      ring.x += (pos.x - ring.x) * 0.14;
      ring.y += (pos.y - ring.y) * 0.14;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        const scale = hovering ? 1.8 : 1;
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.borderColor = hovering ? "rgba(52,211,153,0.8)" : "rgba(52,211,153,0.4)";
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-1.5 h-1.5 rounded-full bg-emerald-400"
        style={{ boxShadow: "0 0 10px rgba(52,211,153,0.9), 0 0 24px rgba(16,185,129,0.4)" }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-8 h-8 rounded-full border transition-[border-color] duration-200"
        style={{ borderColor: "rgba(52,211,153,0.4)" }}
      />
    </>
  );
}
