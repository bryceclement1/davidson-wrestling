import { SeasonSummary } from "@/components/dashboard/SeasonSummary";
import { PeriodBreakdownChart } from "@/components/dashboard/PeriodBreakdownChart";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { RecentMatchesTable } from "@/components/dashboard/RecentMatchesTable";
import { getTeamDashboardData } from "@/lib/analytics/teamQueries";

export default async function TeamDashboardPage() {
  const dashboard = await getTeamDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
            Season Snapshot
          </p>
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {dashboard.seasonLabel}
          </h2>
        </div>
        <div className="flex gap-3">
          <span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]">
            Goal: 90% of matches logged
          </span>
          <span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]">
            Insights: ≥3 per season
          </span>
        </div>
      </div>

      <SeasonSummary data={dashboard} />

      <div className="card-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Period Performance
            </p>
            <p className="text-lg font-semibold text-[var(--brand-navy)]">
              Average points differential by period
            </p>
          </div>
        </div>
        <PeriodBreakdownChart data={dashboard.periodStats} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LeaderboardTable
          title="Wins Leaderboard"
          entries={dashboard.leaderboards.wins}
        />
        <LeaderboardTable
          title="Takedown Leaders"
          entries={dashboard.leaderboards.takedowns}
        />
        <LeaderboardTable
          title="3rd Period Hammers"
          entries={dashboard.leaderboards.thirdPeriod}
        />
        <LeaderboardTable
          title="First Takedown %"
          entries={dashboard.leaderboards.firstTakedown}
        />
      </div>

      <RecentMatchesTable matches={dashboard.recentMatches} />
    </div>
  );
}
