import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// title and description live here. Without this every page inherited the
// root title, so search results, browser tabs and shared links were identical.
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with Google to sync your Sattvic Score across devices.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
