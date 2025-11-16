"use client";

import type { SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-navy)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
