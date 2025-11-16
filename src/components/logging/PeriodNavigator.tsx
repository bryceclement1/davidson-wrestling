"use client";

import { Select } from "@/components/ui/Select";

export interface PeriodOption {
  label: string;
  type: "reg" | "ot" | "tb";
  number: number;
  order: number;
}

interface Props {
  options: PeriodOption[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

export function PeriodNavigator({
  options,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
}: Props) {
  const current = options[currentIndex];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <button
        onClick={onPrev}
        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)] disabled:opacity-40"
        disabled={currentIndex === 0}
      >
        Prev Period
      </button>
      <div className="flex-1 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--neutral-gray)]">
          Current Period
        </p>
        <p className="text-xl font-semibold text-[var(--brand-navy)]">
          {current.label}
        </p>
      </div>
      <button
        onClick={onNext}
        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]"
      >
        Next Period
      </button>
      <Select
        className="w-full text-sm font-semibold text-[var(--brand-navy)] sm:w-48"
        value={String(currentIndex)}
        onChange={(event) => onSelect(Number(event.target.value))}
      >
        {options.map((option, idx) => (
          <option key={option.label} value={idx}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
