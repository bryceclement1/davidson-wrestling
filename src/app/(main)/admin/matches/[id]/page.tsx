import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getMatchById } from "@/lib/db/matches";
import { updateMatchAction } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchEditPage({ params }: PageProps) {
  const resolved = await params;
  const matchId = Number(resolved.id);

  if (!Number.isFinite(matchId)) {
    notFound();
  }

  const match = await getMatchById(matchId);

  if (!match) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
            Match Editor
          </p>
          <h1 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {match.wrestlerName ?? `ID ${match.wrestlerId}`} vs. {match.opponentName}
          </h1>
          <p className="text-sm text-[var(--neutral-gray)]">
            {formatDate(match.date)} • {match.matchType.toUpperCase()}
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]"
        >
          ← Back to Admin
        </Link>
      </div>

      <section className="card-surface space-y-4 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
          Update Match Details
        </h2>
        <form action={updateMatchAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={match.id} />
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Opponent Name
            <input
              name="opponentName"
              defaultValue={match.opponentName}
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Result
            <select
              name="result"
              defaultValue={match.result}
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="W">Win</option>
              <option value="L">Loss</option>
              <option value="D">Draw</option>
              <option value="FF">Forfeit</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Our Score
            <input
              type="number"
              name="ourScore"
              defaultValue={match.ourScore}
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Opponent Score
            <input
              type="number"
              name="opponentScore"
              defaultValue={match.opponentScore}
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white"
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>

      <section className="card-surface space-y-3 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
          Logged Events
        </h2>
        {match.events.length ? (
          <ul className="space-y-2 text-sm">
            {match.events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-[var(--border)] px-4 py-2"
              >
                <p className="font-semibold text-[var(--brand-navy)]">
                  {event.actionType.replace("_", " ")} • Period {event.periodNumber}
                </p>
                <p className="text-[var(--neutral-gray)]">
                  {event.scorer === "us" ? "Davidson" : event.scorer === "opponent" ? "Opponent" : "Neutral"}
                  {event.points ? ` · ${event.points} pts` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--neutral-gray)]">
            No events logged for this match.
          </p>
        )}
      </section>
    </div>
  );
}
