import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Providers } from "@/components/Providers";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { JourneyBar } from "@/components/ui/JourneyBar";
import { ResumeBanner } from "@/components/ui/ResumeBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "Type what you ate in plain language and let AI count the macros. Personalised vegetarian meal plans, Ayurvedic dosha matching, Jain mode, and a shopping list that knows what's already in your fridge.";

export const metadata: Metadata = {
  metadataBase: new URL("https://sattvic.vercel.app"),
  title: "SATTVIC — Premium Vegetarian Meal Planner",
  description: DESCRIPTION,
  openGraph: {
    title: "SATTVIC — Eat with intention",
    description: DESCRIPTION,
    url: "https://sattvic.vercel.app",
    siteName: "SATTVIC",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SATTVIC — Premium Vegetarian Meal Planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SATTVIC — Eat with intention",
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

// Renders at true device width on phones; zoom stays enabled for accessibility.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('sattvic-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-[#0a0a0a] text-zinc-100">
        <Providers>
          <SmoothScroll />
          <Navbar />
          <JourneyBar />
          <main>{children}</main>
          <ResumeBanner />
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
