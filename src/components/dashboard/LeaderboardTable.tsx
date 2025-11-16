import type { LeaderboardEntry } from "@/types/analytics";

interface Props {
  title: string;
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ title, entries }: Props) {
  return (
    <div className="card-surface p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
        {title}
      </p>
      <ul className="mt-4 space-y-3">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--brand-navy)]">
                {index + 1}. {entry.label}
              </p>
              {entry.helper && (
                <p className="text-xs text-[var(--neutral-gray)]">
                  {entry.helper}
                </p>
              )}
            </div>
            <span className="text-lg font-semibold">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
