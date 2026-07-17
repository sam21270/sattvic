import { ImageResponse } from "next/og";

// Social preview card — rendered at build time, shown when the link is
// pasted into WhatsApp, LinkedIn, Slack, iMessage, etc.
export const alt = "SATTVIC — Premium Vegetarian Meal Planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0a",
          backgroundImage: "radial-gradient(circle at 75% 30%, rgba(16,185,129,0.22) 0%, transparent 55%)",
        }}
      >
        {/* logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            🌿
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
            SATTVIC
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 82, fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          Eat with
        </div>
        <div style={{ display: "flex", fontSize: 82, fontWeight: 800, color: "#34d399", letterSpacing: "-0.04em", lineHeight: 1.05, fontStyle: "italic" }}>
          intention.
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa", marginTop: 32, maxWidth: 880, lineHeight: 1.4 }}>
          Type what you ate — AI counts the macros. Ayurvedic meal plans, Jain mode, and a fridge-aware shopping list.
        </div>

        {/* feature chips */}
        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {["AI food logging", "Dosha matching", "Jain friendly", "100% vegetarian"].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                fontSize: 22,
                color: "#6ee7b7",
                border: "1px solid rgba(16,185,129,0.35)",
                background: "rgba(16,185,129,0.1)",
                padding: "10px 22px",
                borderRadius: 999,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
