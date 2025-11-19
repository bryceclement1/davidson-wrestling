"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppUser, UserRole } from "@/types/user";
import { clsx } from "clsx";
import {
  BarChart3,
  CalendarDays,
  LogIn,
  Menu,
  PanelLeftClose,
  Shield,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BarChart3;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Team Dashboard",
    icon: BarChart3,
    roles: ["admin", "standard"],
  },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDays,
    roles: ["admin", "standard"],
  },
  {
    href: "/wrestlers",
    label: "Wrestlers",
    icon: Users,
    roles: ["admin", "standard"],
  },
  {
    href: "/log",
    label: "Match Logging",
    icon: LogIn,
    roles: ["admin", "standard"],
  },
  { href: "/admin", label: "Admin Tools", icon: Shield, roles: ["admin"] },
];

interface Props {
  user: AppUser;
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (event: MediaQueryListEvent) => setIsOpen(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-navy)] shadow-md transition hover:bg-[var(--brand-navy)] hover:text-white lg:left-6"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={clsx(
          "z-30 flex min-h-screen flex-col border-r border-[var(--border)] bg-white transition-[width] duration-300 ease-in-out overflow-hidden lg:static lg:z-auto",
          isOpen ? "w-72 px-6 py-8" : "w-0 px-0 py-8",
        )}
      >
        <div
          className={clsx(
            "transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none lg:pointer-events-auto",
          )}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--neutral-gray)]">
            WrestleMetrics
          </p>
          <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
            Davidson Wrestling
          </h2>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[var(--brand-navy)] text-white"
                      : "text-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/10",
                  )}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span className={clsx(isOpen ? "opacity-100" : "opacity-0 lg:opacity-100")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
        </nav>
        <div
          className={clsx(
            "mt-auto rounded-2xl bg-[var(--brand-navy)]/5 p-4 text-sm text-[var(--brand-navy)] transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none lg:pointer-events-auto",
          )}
        >
          <p className="font-semibold">Season Mission</p>
          <p className="text-xs text-[var(--neutral-gray)]">
            Log ≥ 90% of matches and surface 3 insights per season.
          </p>
        </div>
      </aside>
    </>
  );
}
