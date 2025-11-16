import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getRoster } from "@/lib/db/wrestlers";
import { getWrestlerSeasonStats } from "@/lib/analytics/wrestlerQueries";

export default async function WrestlersPage() {
  const roster = await getRoster();
  const stats = await Promise.all(
    roster.map(async (wrestler) => ({
      wrestler,
      data: await getWrestlerSeasonStats(wrestler.id),
    })),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Wrestler Analytics
        </p>
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          Roster Overview
        </h2>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ wrestler, data }) => (
          <Link
            key={wrestler.id}
            href={`/wrestlers/${wrestler.id}`}
            className="card-surface group space-y-3 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-lg font-semibold text-[var(--brand-navy)]">
                  {wrestler.name}
                </p>
                <p className="text-sm text-[var(--neutral-gray)]">
                  {wrestler.primaryWeightClass} · Class of {wrestler.classYear}
                </p>
              </div>
              <ArrowUpRight className="text-[var(--brand-navy)]" />
            </div>
            {data ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--neutral-gray)]">
                    Record
                  </p>
                  <p className="text-lg font-semibold text-[var(--brand-navy)]">
                    {data.record}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--neutral-gray)]">
                    First TD Win %
                  </p>
                  <p className="text-lg font-semibold text-[var(--brand-navy)]">
                    {Math.round(data.firstTakedownWinPct * 100)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--neutral-gray)]">
                No matches logged yet.
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
