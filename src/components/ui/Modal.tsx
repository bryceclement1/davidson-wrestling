"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";

interface ModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  isOpen,
  onConfirm,
  onClose,
  footer,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-[var(--brand-navy)]">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-[var(--neutral-gray)]">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            className={clsx(
              "rounded-full px-5 py-2 text-sm font-semibold text-white",
              destructive
                ? "bg-[var(--danger-red)]"
                : "bg-[var(--brand-navy)] hover:bg-[#001836]",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        {footer && <div className="mt-4 border-t border-[var(--border)] pt-4">{footer}</div>}
      </div>
    </div>
  );
}
