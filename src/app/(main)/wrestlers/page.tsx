import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getRoster } from "@/lib/db/wrestlers";
import { getWrestlerSeasonStats } from "@/lib/analytics/wrestlerQueries";
import { getAuthenticatedUser, assertRole } from "@/lib/auth/roles";
import {
  addWrestlerAction,
  updateWrestlerAction,
  deleteWrestlerAction,
} from "./actions";

export default async function WrestlersPage() {
  const roster = await getRoster();
  const stats = await Promise.all(
    roster.map(async (wrestler) => ({
      wrestler,
      data: await getWrestlerSeasonStats(wrestler.id),
    })),
  );
  const user = await getAuthenticatedUser();
  const canManageRoster = assertRole(user, "admin");

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
            Wrestler Analytics
          </p>
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            Roster Overview
          </h2>
        </div>
        {canManageRoster && <AddWrestlerForm />}
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ wrestler, data }) => (
          <article
            key={wrestler.id}
            className="card-surface space-y-3 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <Link
              href={`/wrestlers/${wrestler.id}`}
              className="flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-lg font-semibold text-[var(--brand-navy)]">
                  {wrestler.name}
                </p>
                <p className="text-sm text-[var(--neutral-gray)]">
                  {wrestler.primaryWeightClass} · Class of {wrestler.classYear}
                </p>
              </div>
              <ArrowUpRight className="text-[var(--brand-navy)]" />
            </Link>
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
            {canManageRoster && (
              <details className="rounded-xl border border-dashed border-[var(--border)] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-navy)]">
                  Edit Wrestler
                </summary>
                <form
                  action={updateWrestlerAction}
                  className="mt-3 grid gap-2 text-sm"
                >
                  <input type="hidden" name="id" value={wrestler.id} />
                  <label className="flex flex-col gap-1">
                    Name
                    <input
                      name="name"
                      defaultValue={wrestler.name}
                      className="rounded-lg border border-[var(--border)] px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Class Year
                    <input
                      name="classYear"
                      defaultValue={wrestler.classYear ?? ""}
                      className="rounded-lg border border-[var(--border)] px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Weight Class
                    <input
                      name="primaryWeightClass"
                      defaultValue={wrestler.primaryWeightClass ?? ""}
                      className="rounded-lg border border-[var(--border)] px-3 py-2"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    Save
                  </button>
                </form>
                <form
                  action={deleteWrestlerAction}
                  className="mt-2 inline-block"
                >
                  <input type="hidden" name="id" value={wrestler.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--danger-red)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--danger-red)]"
                  >
                    Remove Wrestler
                  </button>
                </form>
              </details>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function AddWrestlerForm() {
  return (
    <form
      action={addWrestlerAction}
      className="card-surface flex flex-col gap-4 rounded-xl border border-[var(--neutral-silver)] p-4"
    >
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm text-[var(--brand-navy)]">
          Full Name
          <input
            name="name"
            required
            className="rounded-lg border border-[var(--neutral-silver)] px-3 py-2 text-base"
            placeholder="e.g. Liam Garcia"
          />
        </label>
        <label className="flex w-full max-w-[160px] flex-col gap-1 text-sm text-[var(--brand-navy)]">
          Class Year
          <input
            name="classYear"
            className="rounded-lg border border-[var(--neutral-silver)] px-3 py-2 text-base"
            placeholder="2027"
          />
        </label>
        <label className="flex w-full max-w-[160px] flex-col gap-1 text-sm text-[var(--brand-navy)]">
          Weight Class
          <input
            name="primaryWeightClass"
            className="rounded-lg border border-[var(--neutral-silver)] px-3 py-2 text-base"
            placeholder="157"
          />
        </label>
      </div>
      <button
        type="submit"
        className="self-start rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white"
      >
        Add Wrestler
      </button>
    </form>
  );
}
