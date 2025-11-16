import { getTeamDashboardData } from "@/lib/analytics/teamQueries";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { RecentMatchesTable } from "@/components/dashboard/RecentMatchesTable";

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
        {value}
      </p>
      {helper && (
        <p className="text-xs text-[var(--neutral-gray)]">{helper}</p>
      )}
    </div>
  );
}

export default async function TeamDashboardPage() {
  const dashboard = await getTeamDashboardData();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
            Team Dashboard
          </p>
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {dashboard.seasonLabel}
          </h2>
          <p className="text-sm text-[var(--neutral-gray)]">
            {dashboard.matchesLogged} matches logged
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Overall Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Record"
            value={dashboard.overall.record}
            helper="Dual + tournament results"
          />
          <MetricCard
            label="Points Scored"
            value={dashboard.overall.pointsFor.toString()}
            helper={`Allowed ${dashboard.overall.pointsAgainst}`}
          />
          <MetricCard
            label="Escapes"
            value={dashboard.overall.escapesFor.toString()}
            helper={`Allowed ${dashboard.overall.escapesAgainst}`}
          />
          <MetricCard
            label="Nearfall Points"
            value={dashboard.overall.nearfallPointsFor.toString()}
            helper={`Allowed ${dashboard.overall.nearfallPointsAgainst}`}
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
            value={formatPercent(dashboard.outcomePredictors.firstTakedownWinPct)}
          />
          <MetricCard
            label="Win % Leading After P1"
            value={formatPercent(dashboard.outcomePredictors.leadingAfterP1WinPct)}
          />
          <MetricCard
            label="Win % Trailing After P1"
            value={formatPercent(dashboard.outcomePredictors.trailingAfterP1WinPct)}
          />
          <MetricCard
            label="Win % Tied Going Into P3"
            value={formatPercent(dashboard.outcomePredictors.tiedHeadingIntoP3WinPct)}
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
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
              {dashboard.outcomePredictors.averagePointsByPeriod.map((period) => (
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
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Takedown Efficiency
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            label="Our Conversion %"
            value={formatPercent(dashboard.takedownEfficiency.ourConversionPct)}
            helper={`${dashboard.takedownEfficiency.ourAttempts} attempts`}
          />
          <MetricCard
            label="Opponent Conversion %"
            value={formatPercent(dashboard.takedownEfficiency.opponentConversionPct)}
            helper={`${dashboard.takedownEfficiency.opponentAttempts} attempts`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Top/Bottom Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="% Matches with 0 Escapes"
            value={formatPercent(dashboard.topBottom.zeroEscapePct)}
          />
          <MetricCard
            label="Ride Outs"
            value={`${dashboard.topBottom.rideOuts.us} - ${dashboard.topBottom.rideOuts.opponent}`}
            helper="Ours vs Opponent"
          />
          <MetricCard
            label="Riding Time Point %"
            value={formatPercent(dashboard.topBottom.ridingTimePointPct.us)}
            helper={`Opponent ${formatPercent(dashboard.topBottom.ridingTimePointPct.opponent)}`}
          />
          <MetricCard
            label="Reversals"
            value={`${dashboard.topBottom.reversals.us} - ${dashboard.topBottom.reversals.opponent}`}
            helper="Created vs Allowed"
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
            value={dashboard.stall.avgUs.toFixed(2)}
          />
          <MetricCard
            label="Avg Stall Calls on Opponents"
            value={dashboard.stall.avgOpponent.toFixed(2)}
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
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
              {dashboard.stall.byPeriod.map((period) => (
                <tr key={period.label}>
                  <td className="px-4 py-2">{period.label}</td>
                  <td className="px-4 py-2">{period.us}</td>
                  <td className="px-4 py-2">{period.opponent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Clutch Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Overtime Win %"
            value={formatPercent(dashboard.clutch.overtimeWinPct)}
          />
          <MetricCard
            label="1-Point Margin Win %"
            value={formatPercent(dashboard.clutch.onePointWinPct)}
          />
          <MetricCard
            label="2-Point Margin Win %"
            value={formatPercent(dashboard.clutch.twoPointWinPct)}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <LeaderboardTable
          title="Wins Leaderboard"
          entries={dashboard.leaderboards.wins}
        />
        <LeaderboardTable
          title="Takedown Leaders"
          entries={dashboard.leaderboards.takedowns}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
          Recent Matches
        </h3>
        <RecentMatchesTable matches={dashboard.recentMatches} />
      </section>
    </div>
  );
}
