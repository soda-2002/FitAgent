"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bot, CalendarCheck, Dumbbell, Home, Salad, Soup, UserRound } from "lucide-react";
import { cn } from "@/components/ui";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/food", label: "Food", icon: Salad },
  { href: "/meal", label: "Meal", icon: Soup },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/daily", label: "Daily", icon: CalendarCheck },
  { href: "/coach", label: "Coach", icon: Bot },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-black leading-4 text-slate-950">FitAgent</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">AI Coach</span>
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-lg bg-slate-100/70 p-1">
        {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition",
                path === l.href
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
        ))}
        </div>
      </div>
    </nav>
  );
}
