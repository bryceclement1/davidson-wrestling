"use client";

import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-navy)]",
        className,
      )}
      {...props}
    />
  );
}
