import type { MetadataRoute } from "next";

const BASE = "https://sattvic.vercel.app";

// Only the pages worth landing on cold. /u/[username] is deliberately absent:
// profiles are private by default, so listing them would advertise accounts
// their owners never chose to make public.
const paths = [
  "", "/recipes", "/meal-planner", "/macros", "/dosha",
  "/junk", "/fridge", "/workout", "/login", "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
}
