import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// title and description live here. Without this every page inherited the
// root title, so search results, browser tabs and shared links were identical.
export const metadata: Metadata = {
  title: "Healthy Junk",
  description: "The craving, made lighter — pizza, fries and cake with the macros worked out.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
