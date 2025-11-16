import type { ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx("card-surface p-5 shadow-sm", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--neutral-gray)]">
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--neutral-gray)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children }: CardProps) {
  return <div className="space-y-4">{children}</div>;
}
