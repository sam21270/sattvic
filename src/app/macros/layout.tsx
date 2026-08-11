import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// title and description live here. Without this every page inherited the
// root title, so search results, browser tabs and shared links were identical.
export const metadata: Metadata = {
  title: "Macro Calculator",
  description: "Personalised daily calorie and macro targets from your body, activity and goal.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
