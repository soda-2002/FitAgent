"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/food", label: "Food" },
  { href: "/meal", label: "Meal Planner" },
  { href: "/workout", label: "Workout" },
  { href: "/daily", label: "Daily" },
  { href: "/coach", label: "AI Coach" },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-bold text-green-600 text-lg mr-4">FitAgent</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === l.href
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
