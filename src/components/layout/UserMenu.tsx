"use client";

import { useEffect, useRef, useState } from "react";
import type { AppUser } from "@/types/user";
import { logoutAction } from "@/app/(auth)/actions";

interface Props {
  user: AppUser;
}

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-4 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--neutral-gray)] shadow-sm"
      >
        <span className="font-semibold text-[var(--brand-navy)]">
          {user?.name ?? "Mat Logger"}
        </span>
        <span className="rounded-full bg-[var(--brand-navy)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-navy)]">
          {user?.role === "admin" ? "Admin" : "Standard"}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border)] bg-white shadow-lg">
          <div className="border-b border-[var(--border)] px-4 py-3 text-xs text-[var(--neutral-gray)]">
            Signed in as
            <p className="truncate font-semibold text-[var(--brand-navy)]">
              {user.email}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full px-4 py-3 text-left text-sm font-semibold text-[var(--danger-red)] hover:bg-[var(--muted)]"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
