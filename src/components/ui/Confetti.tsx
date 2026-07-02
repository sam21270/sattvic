"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  trigger: boolean;
  origin?: { x: number; y: number };
  colors?: string[];
}

export function Confetti({
  trigger,
  origin = { x: 0.5, y: 0.5 },
  colors = ["#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#38bdf8", "#ffffff"],
}: Props) {
  useEffect(() => {
    if (!trigger) return;

    confetti({
      particleCount: 120,
      spread: 80,
      origin,
      colors,
      ticks: 200,
      gravity: 0.8,
      scalar: 1.1,
      shapes: ["circle", "square"],
    });

    // second burst slightly offset
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
      });
    }, 150);
  }, [trigger]); // eslint-disable-line

  return null;
}
