"use client";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  size = 80,
  duration = 3,
  colorFrom = "#10b981",
  colorTo = "#8b5cf6",
}: BorderBeamProps) {
  return (
    <div
      className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      <div
        className="absolute"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colorFrom}, ${colorTo}, transparent 70%)`,
          filter: "blur(6px)",
          opacity: 0.8,
          animation: `border-beam ${duration}s linear infinite`,
          offsetPath: `rect(0 100% 100% 0 round inherit)`,
          offsetRotate: "0deg",
        } as any}
      />
    </div>
  );
}
