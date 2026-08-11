import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// title and description live here. Without this every page inherited the
// root title, so search results, browser tabs and shared links were identical.
export const metadata: Metadata = {
  title: "Meal Planner",
  description: "A vegetarian week planned around your dosha, your macros and what's in your fridge.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
