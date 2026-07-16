"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

// 3D perspective tilt card with a moving glare highlight.
// The card physically rotates toward the cursor (shots.so style).
export function TiltCard({
  children,
  maxTilt = 10,
  glare = true,
  className = "",
}: {
  children: ReactNode;
  maxTilt?: number;
  glare?: boolean;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // skip on touch — tilt needs a hover pointer
      if (e.pointerType === "touch") return;

      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1

      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rotY = (px - 0.5) * 2 * maxTilt;
        const rotX = -(py - 0.5) * 2 * maxTilt;
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
        if (glare) setGlarePos({ x: px * 100, y: py * 100, opacity: 1 });
      });
    },
    [maxTilt, glare]
  );

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    setGlarePos((p) => ({ ...p, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.10) 0%, transparent 55%)`,
          }}
        />
      )}
    </div>
  );
}
