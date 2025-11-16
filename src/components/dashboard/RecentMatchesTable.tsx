import type { MatchWithEvents } from "@/types/match";
import { formatDate } from "@/lib/utils";

interface Props {
  matches: MatchWithEvents[];
}

export function RecentMatchesTable({ matches }: Props) {
  return (
    <div className="card-surface overflow-hidden shadow-sm">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Recent Matches
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)] text-sm">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                Date
              </th>
              <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                Wrestler
              </th>
              <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                Opponent
              </th>
              <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                Result
              </th>
              <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                First TD
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {matches.map((match) => (
              <tr key={match.id}>
                <td className="px-5 py-3">{formatDate(match.date)}</td>
                <td className="px-5 py-3">
                  {match.wrestlerName ?? `ID ${match.wrestlerId}`}
                </td>
                <td className="px-5 py-3">{match.opponentName}</td>
                <td className="px-5 py-3 font-semibold">
                  <span
                    className={
                      match.result === "W"
                        ? "text-[var(--success-green)]"
                        : match.result === "L"
                          ? "text-[var(--danger-red)]"
                          : "text-[var(--brand-navy)]"
                    }
                  >
                    {match.result} {match.ourScore}-{match.opponentScore}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {match.firstTakedownScorer === "us"
                    ? "Davidson"
                    : match.firstTakedownScorer === "opponent"
                      ? "Opponent"
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
