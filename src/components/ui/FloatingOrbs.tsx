"use client";

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {/* orb 1 — emerald top-left */}
      <div
        className="absolute rounded-full blur-[120px] opacity-20 animate-orb-1"
        style={{ width: 600, height: 600, top: "-10%", left: "-10%", background: "radial-gradient(circle, #10b981, #059669)" }}
      />
      {/* orb 2 — violet top-right */}
      <div
        className="absolute rounded-full blur-[140px] opacity-15 animate-orb-2"
        style={{ width: 500, height: 500, top: "5%", right: "-8%", background: "radial-gradient(circle, #8b5cf6, #6d28d9)" }}
      />
      {/* orb 3 — amber mid */}
      <div
        className="absolute rounded-full blur-[160px] opacity-10 animate-orb-3"
        style={{ width: 400, height: 400, top: "40%", left: "30%", background: "radial-gradient(circle, #f59e0b, #d97706)" }}
      />
      {/* orb 4 — rose bottom-right */}
      <div
        className="absolute rounded-full blur-[120px] opacity-12 animate-orb-4"
        style={{ width: 350, height: 350, bottom: "5%", right: "10%", background: "radial-gradient(circle, #f43f5e, #e11d48)" }}
      />
    </div>
  );
}
