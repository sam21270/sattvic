"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [hidden, setHidden] = useState(true);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  const x = useSpring(rawX, { stiffness: 500, damping: 40 });
  const y = useSpring(rawY, { stiffness: 500, damping: 40 });

  const trailX = useSpring(rawX, { stiffness: 120, damping: 28 });
  const trailY = useSpring(rawY, { stiffness: 120, damping: 28 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setHidden(false);
    };

    const handleOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("a, button, [data-cursor]");
      setHovered(!!el);
    };

    const down = () => setClicked(true);
    const up = () => setClicked(false);
    const leave = () => setHidden(true);
    const enter = () => setHidden(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", handleOver);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", handleOver);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, [rawX, rawY]);

  return (
    <>
      {/* trail orb */}
      <motion.div
        style={{ x: trailX, y: trailY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovered ? 48 : clicked ? 20 : 36,
          height: hovered ? 48 : clicked ? 20 : 36,
          opacity: hidden ? 0 : hovered ? 0.15 : 0.08,
        }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 left-0 rounded-full bg-emerald-500 pointer-events-none z-[9998]"
      />
      {/* dot */}
      <motion.div
        ref={cursorRef}
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovered ? 8 : clicked ? 4 : 6,
          height: hovered ? 8 : clicked ? 4 : 6,
          opacity: hidden ? 0 : 1,
          backgroundColor: hovered ? "#059669" : "#1a1a1a",
        }}
        transition={{ duration: 0.15 }}
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
      />
    </>
  );
}
