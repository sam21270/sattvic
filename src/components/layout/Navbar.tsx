"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Leaf, CalendarDays, BookOpen, Calculator, LayoutDashboard, Refrigerator, Flower2, LogIn, User, Pizza, Dumbbell, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/meal-planner",label: "Meal Planner", icon: CalendarDays },
  { href: "/recipes",     label: "Recipes",      icon: BookOpen },
  { href: "/macros",      label: "Macros",       icon: Calculator },
  { href: "/dosha",       label: "Dosha Quiz",   icon: Flower2 },
  { href: "/fridge",      label: "My Fridge",    icon: Refrigerator },
  { href: "/junk",        label: "Healthy Junk", icon: Pizza },
  { href: "/workout",     label: "Workout",      icon: Dumbbell },
  { href: "/progress",    label: "Progress",     icon: TrendingUp },
  { href: "/social",      label: "Social",       icon: Users },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="sattvic-nav backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SATTVIC</span>
          </Link>

          <div className="flex items-center gap-0.5 overflow-x-auto">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  pathname === href
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          <div className="shrink-0 ml-2">
            {session ? (
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === "/profile"
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {session.user?.image ? (
                  <img src={session.user.image} className="w-5 h-5 rounded-full" alt="" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{session.user?.name?.split(" ")[0]}</span>
              </Link>
            ) : (
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-200 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
