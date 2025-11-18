import { notFound } from "next/navigation";
import { getWrestlerSeasonStats } from "@/lib/analytics/wrestlerQueries";
import { PeriodBreakdownChart } from "@/components/dashboard/PeriodBreakdownChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { getWrestlerById } from "@/lib/db/wrestlers";
import type { WrestlerSeasonStats } from "@/types/analytics";
import type { Wrestler } from "@/types/wrestler";

const formatPercent = (value: number | null | undefined) =>
  `${Math.round((value ?? 0) * 100)}%`;

interface Props {
  params: Promise<{ id: string }>;
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
        {value}
      </p>
      {helper && (
        <p className="text-xs text-[var(--neutral-gray)]">{helper}</p>
      )}
    </Card>
  );
}

function createEmptyStats(wrestler: Wrestler): WrestlerSeasonStats {
  return {
    wrestler,
    record: "0-0",
    winPercentage: 0,
    totalPointsFor: 0,
    totalPointsAgainst: 0,
    firstTakedownWinPct: 0,
    ridingTimeAdvantagePct: 0,
    matches: [],
    periods: [],
    overall: {
      pointsFor: 0,
      pointsAgainst: 0,
      escapesFor: 0,
      escapesAgainst: 0,
      nearfallPointsFor: 0,
      nearfallPointsAgainst: 0,
      decisionWins: 0,
      majorDecisionWins: 0,
      techFallWins: 0,
      fallWins: 0,
    },
    outcomePredictors: {
      firstTakedownWinPct: 0,
      leadingAfterP1WinPct: 0,
      trailingAfterP1WinPct: 0,
      tiedHeadingIntoP3WinPct: 0,
      averagePointsByPeriod: [],
    },
    takedownEfficiency: {
      ourConversionPct: 0,
      opponentConversionPct: 0,
      ourTakedowns: 0,
      ourAttempts: 0,
      mostCommonTakedown: null,
      mostCommonShot: null,
      avgTakedownsInP3: { us: 0, opponent: 0 },
      shotAttemptsByPeriod: [],
    },
    topBottom: {
      zeroEscapePct: 0,
      rideOutAvg: { us: 0, opponent: 0 },
      ridingTimePointPct: { us: 0, opponent: 0 },
      reversalsAvg: { us: 0, opponent: 0 },
      nearfallAvg: { us: 0, opponent: 0 },
    },
    stall: {
      avgUs: 0,
      avgOpponent: 0,
      byPeriod: [],
    },
    clutch: {
      overtimeWinPct: 0,
      threePointMarginWinPct: 0,
    },
    recentMatches: [],
  };
}

export default async function WrestlerDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const wrestlerId = Number(resolvedParams.id);

  if (Number.isNaN(wrestlerId)) {
    notFound();
  }

  const statsPromise = getWrestlerSeasonStats(wrestlerId);
  const profilePromise = getWrestlerById(wrestlerId);

  const [stats, profile] = await Promise.all([statsPromise, profilePromise]);

  if (!profile && !stats) {
    notFound();
  }

  const fallbackWrestler: Wrestler =
    stats?.wrestler ??
    profile ?? {
      id: wrestlerId,
      name: `Wrestler ${wrestlerId}`,
      active: true,
    };

  const displayStats = stats ?? createEmptyStats(fallbackWrestler);
  const overall = displayStats.overall;
  const outcome = displayStats.outcomePredictors;
  const efficiency = displayStats.takedownEfficiency;
  const topBottom = displayStats.topBottom;
  const stall = displayStats.stall;
  const clutch = displayStats.clutch;
  const hasPeriodData = displayStats.periods.length > 0;
  const hasRecentMatches = displayStats.recentMatches.length > 0;
  const regAveragePoints = outcome.averagePointsByPeriod.filter((period) =>
    period.label.startsWith("Period"),
  );
  const regStallBreakdown = stall.byPeriod.filter((period) =>
    period.label.startsWith("Period"),
  );
  const totalTakedownVolume =
    efficiency.ourTakedowns + efficiency.ourAttempts;
  const conversionHelper =
    totalTakedownVolume > 0
      ? `Takedowns: ${efficiency.ourTakedowns} / ${totalTakedownVolume}`
      : "No takedown attempts logged";

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-[var(--brand-navy)] p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] opacity-80">
          Wrestler Dashboard
        </p>
        <h2 className="text-3xl font-semibold">{displayStats.wrestler.name}</h2>
        <p className="text-sm opacity-80">
          Weight: {displayStats.wrestler.primaryWeightClass ?? "—"} · Class of{" "}
          {displayStats.wrestler.classYear ?? "—"}
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Overall Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Record"
            value={displayStats.record}
            helper={`Win % ${formatPercent(displayStats.winPercentage)}`}
          />
          <MetricCard
            label="Points Scored"
            value={overall.pointsFor.toString()}
            helper={`Allowed ${overall.pointsAgainst}`}
          />
          <MetricCard
            label="Escapes Earned"
            value={overall.escapesFor.toString()}
            helper={`Allowed ${overall.escapesAgainst}`}
          />
          <MetricCard
            label="Nearfall Points"
            value={overall.nearfallPointsFor.toString()}
            helper={`Allowed ${overall.nearfallPointsAgainst}`}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Decision Wins"
            value={overall.decisionWins.toString()}
          />
          <MetricCard
            label="Major Decision Wins"
            value={overall.majorDecisionWins.toString()}
          />
          <MetricCard
            label="Tech Fall Wins"
            value={overall.techFallWins.toString()}
          />
          <MetricCard
            label="Fall Wins"
            value={overall.fallWins.toString()}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Match Outcome Predictors
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Win % w/ First Takedown"
            value={formatPercent(outcome.firstTakedownWinPct)}
          />
          <MetricCard
            label="Win % Leading After P1"
            value={formatPercent(outcome.leadingAfterP1WinPct)}
          />
          <MetricCard
            label="Win % Trailing After P1"
            value={formatPercent(outcome.trailingAfterP1WinPct)}
          />
          <MetricCard
            label="Win % Tied Going Into P3"
            value={formatPercent(outcome.tiedHeadingIntoP3WinPct)}
          />
        </div>
        <Card>
          <CardHeader
            title="Average Points by Period"
            description="Scoring pace per period for this wrestler vs opponents"
          />
          <CardBody>
            {regAveragePoints.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        Period
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        Davidson
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        Opponent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white">
                    {regAveragePoints.map((period) => (
                      <tr key={period.label}>
                        <td className="px-4 py-2">{period.label}</td>
                        <td className="px-4 py-2">
                          {period.us.toFixed(1)}
                        </td>
                        <td className="px-4 py-2">
                          {period.opponent.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[var(--neutral-gray)]">
                No period scoring data yet.
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Takedown Efficiency
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Our Conversion %"
            value={formatPercent(efficiency.ourConversionPct)}
            helper={conversionHelper}
          />
          <MetricCard
            label="Opponent Conversion %"
            value={formatPercent(efficiency.opponentConversionPct)}
          />
          <MetricCard
            label="Avg P3 Takedowns"
            value={efficiency.avgTakedownsInP3.us.toFixed(2)}
            helper={`Allowed ${efficiency.avgTakedownsInP3.opponent.toFixed(2)}`}
          />
          <MetricCard
            label="Most Common Takedown"
            value={efficiency.mostCommonTakedown?.type ?? "—"}
            helper={
              efficiency.mostCommonTakedown
                ? `Total ${efficiency.mostCommonTakedown.total} · Avg ${efficiency.mostCommonTakedown.avgPerMatch.toFixed(2)}`
                : "No takedowns logged yet"
            }
          />
          <MetricCard
            label="Most Common Shot Attempt"
            value={efficiency.mostCommonShot?.type ?? "—"}
            helper={
              efficiency.mostCommonShot
                ? `Total ${efficiency.mostCommonShot.total} · Avg ${efficiency.mostCommonShot.avgPerMatch.toFixed(2)}`
                : "No shot attempts logged yet"
            }
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Average Takedowns by Period"
              description="Per-match takedown pace"
            />
            <CardBody>
              {hasPeriodData ? (
                <PeriodBreakdownChart data={displayStats.periods} />
              ) : (
                <p className="text-sm text-[var(--neutral-gray)]">
                  Not enough match events to build a period breakdown yet.
                </p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Shot Attempts by Period"
              description="Average attempts per match"
            />
            <CardBody>
              {efficiency.shotAttemptsByPeriod.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                    <thead className="bg-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                          Period
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                          Attempts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-white">
                      {efficiency.shotAttemptsByPeriod
                        .sort((a, b) => a.order - b.order)
                        .map((period) => (
                          <tr key={period.label}>
                            <td className="px-4 py-2">{period.label}</td>
                            <td className="px-4 py-2">
                              {period.attempts.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--neutral-gray)]">
                  No shot attempts recorded yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Top/Bottom Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="% Matches with 0 Escapes"
            value={formatPercent(topBottom.zeroEscapePct)}
          />
          <MetricCard
            label="Ride Outs per Match"
            value={topBottom.rideOutAvg.us.toFixed(2)}
            helper={`Opponent ${topBottom.rideOutAvg.opponent.toFixed(2)}`}
          />
          <MetricCard
            label="Riding Time Point %"
            value={formatPercent(topBottom.ridingTimePointPct.us)}
            helper={`Opponent ${formatPercent(topBottom.ridingTimePointPct.opponent)}`}
          />
          <MetricCard
            label="Reversals per Match"
            value={topBottom.reversalsAvg.us.toFixed(2)}
            helper={`Allowed ${topBottom.reversalsAvg.opponent.toFixed(2)}`}
          />
          <MetricCard
            label="Nearfall Points per Match"
            value={topBottom.nearfallAvg.us.toFixed(2)}
            helper={`Allowed ${topBottom.nearfallAvg.opponent.toFixed(2)}`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Stall Calls
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            label="Avg Stall Calls on Davidson"
            value={stall.avgUs.toFixed(2)}
          />
          <MetricCard
            label="Avg Stall Calls on Opponent"
            value={stall.avgOpponent.toFixed(2)}
          />
        </div>
        <Card>
          <CardHeader title="Average Stall Calls by Period" />
          <CardBody>
            {regStallBreakdown.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        Period
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        On Davidson
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        On Opponent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white">
                    {regStallBreakdown.map((period) => (
                      <tr key={period.label}>
                        <td className="px-4 py-2">{period.label}</td>
                        <td className="px-4 py-2">
                          {period.us.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          {period.opponent.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[var(--neutral-gray)]">
                No stall calls logged yet.
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Clutch Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <MetricCard
            label="Overtime Win %"
            value={formatPercent(clutch.overtimeWinPct)}
          />
          <MetricCard
            label="3-Point Margin Win %"
            value={formatPercent(clutch.threePointMarginWinPct)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Recent Matches
        </h3>
        <Card>
          <CardHeader
            title="Last 10 Results"
            description="Includes duals and tournament bouts"
          />
          <CardBody>
            {hasRecentMatches ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                        Event
                      </th>
                  <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                    Opponent
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-[var(--neutral-gray)]">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {displayStats.recentMatches.map((match) => (
                  <tr key={match.id}>
                        <td className="px-4 py-2">{formatDate(match.date)}</td>
                        <td className="px-4 py-2">
                          {match.eventName ??
                            (match.matchType === "dual"
                              ? "Dual Meet"
                              : "Tournament")}
                        </td>
                        <td className="px-4 py-2">{match.opponentName}</td>
                        <td className="px-4 py-2 font-semibold">
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
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[var(--neutral-gray)]">
                No matches have been logged for this wrestler yet.
              </p>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
