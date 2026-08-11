import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// title and description live here. Without this every page inherited the
// root title, so search results, browser tabs and shared links were identical.
export const metadata: Metadata = {
  title: "Recipes",
  description: "Viral vegetarian recipes with macros — or import any recipe from a blog or YouTube link.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
