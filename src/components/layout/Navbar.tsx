"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Leaf, CalendarDays, BookOpen, Calculator, LayoutDashboard, Refrigerator, Flower2, LogIn, User, Pizza, Dumbbell, TrendingUp, Users, Menu, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  // close the drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const AccountButton = ({ full = false }: { full?: boolean }) =>
    session ? (
      <Link
        href="/profile"
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
          full && "w-full",
          pathname === "/profile" ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
        )}
      >
        {session.user?.image ? (
          <img src={session.user.image} className="w-5 h-5 rounded-full" alt="" />
        ) : (
          <User className="w-4 h-4" />
        )}
        <span className={full ? "" : "hidden sm:inline"}>{session.user?.name?.split(" ")[0]}</span>
      </Link>
    ) : (
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors whitespace-nowrap",
          full && "w-full justify-center"
        )}
      >
        <LogIn className="w-4 h-4" />
        Sign in
      </button>
    );

  return (
    <nav className="sattvic-nav backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SATTVIC</span>
          </Link>

          {/* desktop nav — hidden below xl where 10 links stop fitting */}
          <div className="hidden xl:flex items-center gap-0.5 min-w-0">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                  pathname === href ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block"><AccountButton /></div>
            {/* hamburger — everything below xl */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="xl:hidden w-11 h-11 flex items-center justify-center rounded-xl text-zinc-300 hover:bg-white/[0.06] transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <>
          <div
            className="xl:hidden fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
          <div className="xl:hidden fixed top-16 inset-x-0 z-50 bg-[#0f0f0f] border-b border-white/[0.08] max-h-[calc(100dvh-4rem)] overflow-y-auto" data-lenis-prevent>
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors",
                    pathname === href
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "text-zinc-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="px-4 pb-4 sm:hidden">
              <AccountButton full />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
