import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Archivo, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Providers } from "@/components/Providers";
import { JourneyBar } from "@/components/ui/JourneyBar";
import { ResumeBanner } from "@/components/ui/ResumeBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-serif", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${instrumentSerif.variable} h-full antialiased`} data-theme="dark" suppressHydrationWarning>
      {/* Dark-only: the light theme was never finished, so there is no toggle
          and no theme script. data-theme="dark" on <html> is the whole story.
          Note: the [data-theme="light"] CSS is now unreachable dead code —
          kept so light mode can be finished later; delete it if it never is. */}
      <body className="min-h-full bg-[#0a0a0a] text-zinc-100">
        <Providers>
          <SmoothScroll />
          <Navbar />
          <JourneyBar />
          <main>{children}</main>
          {/* The privacy policy has to be reachable from somewhere: Google's
              OAuth consent screen expects a link, and a meal tracker that
              stores what you eat should not hide it. There was no footer at
              all, so this is the whole of one. */}
          <footer className="border-t border-white/[0.06] mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
              <span>© {new Date().getFullYear()} SATTVIC</span>
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            </div>
          </footer>
          <ResumeBanner />
        </Providers>
      </body>
    </html>
  );
}
