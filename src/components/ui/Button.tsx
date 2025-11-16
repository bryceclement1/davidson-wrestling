"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "md" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-navy)] text-white hover:bg-[#001836] transition-colors",
  secondary:
    "bg-white text-[var(--brand-navy)] border border-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/5",
  outline:
    "border border-[var(--border)] text-[var(--brand-navy)] bg-white hover:bg-[var(--brand-navy)]/5",
  ghost: "text-[var(--brand-navy)] hover:bg-[var(--muted)]",
  destructive:
    "bg-[var(--danger-red)] text-white hover:bg-[var(--danger-red)]/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
