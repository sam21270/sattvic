import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SATTVIC — Premium Vegetarian Meal Planner",
  description: "Personalized vegetarian meal planning, macro tracking, and Ayurvedic nutrition — designed around your body.",
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
