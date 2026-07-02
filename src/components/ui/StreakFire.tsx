"use client";

import { motion } from "framer-motion";

interface Props {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakFire({ streak, size = "md" }: Props) {
  const intensity = Math.min(streak / 30, 1); // 0–1 based on streak
  const particleCount = streak === 0 ? 0 : streak < 3 ? 2 : streak < 7 ? 4 : streak < 14 ? 6 : 8;

  const sizeMap = { sm: 32, md: 48, lg: 64 };
  const px = sizeMap[size];

  const particles = Array.from({ length: particleCount });

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: px, height: px }}>
      {/* animated particles */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i * 1.5,
            height: 4 + i * 1.5,
            background: i % 2 === 0 ? "#f97316" : "#fbbf24",
            left: `${15 + i * 8}%`,
            bottom: "60%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -px * (0.5 + i * 0.1), -px * (0.9 + i * 0.05)],
            x: [0, (i % 2 === 0 ? 1 : -1) * (3 + i * 2), 0],
            opacity: [0.9, 0.6, 0],
            scale: [1, 0.8, 0.3],
          }}
          transition={{
            duration: 0.8 + i * 0.12,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeOut",
          }}
        />
      ))}

      {/* main flame emoji, sized + colored by intensity */}
      <motion.span
        className="text-center select-none leading-none"
        style={{ fontSize: px * 0.75 }}
        animate={streak > 0 ? {
          scale: [1, 1.08, 1],
          filter: [
            `drop-shadow(0 0 ${4 + intensity * 12}px #f97316)`,
            `drop-shadow(0 0 ${8 + intensity * 16}px #fbbf24)`,
            `drop-shadow(0 0 ${4 + intensity * 12}px #f97316)`,
          ],
        } : {}}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        🔥
      </motion.span>

      {/* streak number badge */}
      {streak > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0a]"
          style={{ width: px * 0.42, height: px * 0.42 }}
        >
          {streak}
        </motion.div>
      )}
    </div>
  );
}
