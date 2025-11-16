
import { notFound } from "next/navigation";
import { getWrestlerSeasonStats } from "@/lib/analytics/wrestlerQueries";
import { PeriodBreakdownChart } from "@/components/dashboard/PeriodBreakdownChart";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { getWrestlerById } from "@/lib/db/wrestlers";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WrestlerDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const wrestlerId = Number(resolvedParams.id);
  const statsPromise = getWrestlerSeasonStats(wrestlerId);
  const profilePromise = getWrestlerById(wrestlerId);

  const [stats, profile] = await Promise.all([statsPromise, profilePromise]);

  if (!profile && !stats) {
    notFound();
  }

  const fallbackStats = {
    wrestler: profile ?? stats!.wrestler,
    record: stats?.record ?? "0-0",
    winPercentage: stats?.winPercentage ?? 0,
    totalPointsFor: stats?.totalPointsFor ?? 0,
    totalPointsAgainst: stats?.totalPointsAgainst ?? 0,
    firstTakedownWinPct: stats?.firstTakedownWinPct ?? 0,
    ridingTimeAdvantagePct: stats?.ridingTimeAdvantagePct ?? 0,
    matches: stats?.matches ?? [],
    periods: stats?.periods ?? [],
  };

  const hasMatches = fallbackStats.matches.length > 0;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-[var(--brand-navy)] p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] opacity-80">
          Wrestler Dashboard
        </p>
        <h2 className="text-3xl font-semibold">{fallbackStats.wrestler.name}</h2>
        <p className="text-sm opacity-80">
          Weight: {fallbackStats.wrestler.primaryWeightClass} · Class of{" "}
          {fallbackStats.wrestler.classYear}
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-[var(--neutral-gray)]">
            Record
          </p>
          <p className="text-2xl font-semibold text-[var(--brand-navy)]">
            {fallbackStats.record}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-[var(--neutral-gray)]">
            Win %
          </p>
          <p className="text-2xl font-semibold text-[var(--brand-navy)]">
            {Math.round(fallbackStats.winPercentage * 100)}%
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-[var(--neutral-gray)]">
            First TD Win %
          </p>
          <p className="text-2xl font-semibold text-[var(--brand-navy)]">
            {Math.round(fallbackStats.firstTakedownWinPct * 100)}%
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-[var(--neutral-gray)]">
            Riding Time Advantage
          </p>
          <p className="text-2xl font-semibold text-[var(--brand-navy)]">
            {Math.round(fallbackStats.ridingTimeAdvantagePct * 100)}%
          </p>
        </Card>
      </div>
      <Card>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Period Breakdown
        </p>
        <div className="mt-4">
          {hasMatches ? (
            <PeriodBreakdownChart data={fallbackStats.periods} />
          ) : (
            <p className="text-sm text-[var(--neutral-gray)]">
              No match events logged yet.
            </p>
          )}
        </div>
      </Card>
      <Card>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Match Log
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)]">
          {hasMatches ? (
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                    Date
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
                {fallbackStats.matches.map((match) => (
                  <tr key={match.id}>
                    <td className="px-5 py-3">{formatDate(match.date)}</td>
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
                    <td className="px-5 py-3 capitalize">
                      {match.firstTakedownScorer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--neutral-gray)]">
              No matches have been logged for this wrestler yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
