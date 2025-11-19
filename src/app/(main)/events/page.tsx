import { listEvents } from "@/lib/db/events";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "./actions";
import { getAuthenticatedUser, assertRole } from "@/lib/auth/roles";
import {
  getDualEventSummary,
  type DualEventSummary,
} from "@/lib/db/matches";
import type { MatchOutcomeType } from "@/types/match";

export default async function EventsPage() {
  const events = await listEvents();
  const user = await getAuthenticatedUser();
  const canManage = assertRole(user, "admin");

  const dualSummariesEntries = await Promise.all(
    events.map(async (event) => {
      if (event.type !== "dual") return [event.id, null] as const;
      const summary = await getDualEventSummary(event.id);
      return [event.id, summary] as const;
    }),
  );

  const dualSummaryMap = new Map(
    dualSummariesEntries.filter(
      (entry): entry is [number, DualEventSummary] => entry[1] !== null,
    ),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Competition Calendar
        </p>
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          Events & Dual Meets
        </h2>
        <p className="text-sm text-[var(--neutral-gray)]">
          Log upcoming duals or tournaments once and connect them to match logs later.
        </p>
      </header>

      <section className="card-surface rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <form
          action={createEventAction}
          className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr,1fr] lg:items-end"
        >
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Event Name
            <input
              name="name"
              required
              placeholder="e.g. SoCon Championships"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Date
            <input
              type="date"
              name="date"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Type
            <select
              name="eventType"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
              defaultValue="dual"
            >
              <option value="dual">Dual Meet</option>
              <option value="tournament">Tournament</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Opponent School (Dual)
            <input
              name="opponentSchool"
              placeholder="Wofford"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            />
          </label>
          <div className="lg:col-span-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            >
              Add Event
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--brand-navy)]">Upcoming & Logged Events</h3>
        {events.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {events.map((event) => {
              const dualSummary =
                event.type === "dual"
                  ? dualSummaryMap.get(event.id) ?? {
                      matches: [],
                      ourScore: 0,
                      opponentScore: 0,
                    }
                  : null;
              return (
                <article
                  key={event.id}
                  className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
                >
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
                  {event.type === "dual" ? "Dual Meet" : "Tournament"}
                </p>
                <h4 className="mt-1 text-xl font-semibold text-[var(--brand-navy)]">
                  {event.name}
                </h4>
                <p className="text-sm text-[var(--neutral-gray)]">
                  {formatDate(event.date)}
                </p>
                {event.type === "dual" && event.opponentSchool && (
                  <p className="text-sm text-[var(--brand-navy)]">
                    vs. {event.opponentSchool}
                  </p>
                )}
                {dualSummary && (
                  <DualScoreCard
                    summary={dualSummary}
                    opponent={event.opponentSchool ?? "Opponent"}
                  />
                )}
                {canManage && (
                  <details className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-navy)]">
                      Edit Event
                    </summary>
                    <form action={updateEventAction} className="mt-3 space-y-2 text-sm">
                      <input type="hidden" name="id" value={event.id} />
                      <label className="flex flex-col gap-1">
                        Name
                        <input
                          name="name"
                          defaultValue={event.name}
                          className="rounded-lg border border-[var(--border)] px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        Date
                        <input
                          type="date"
                          name="date"
                          defaultValue={event.date.slice(0, 10)}
                          className="rounded-lg border border-[var(--border)] px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        Type
                        <select
                          name="eventType"
                          defaultValue={event.type}
                          className="rounded-lg border border-[var(--border)] px-3 py-2"
                        >
                          <option value="dual">Dual</option>
                          <option value="tournament">Tournament</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        Opponent School
                        <input
                          name="opponentSchool"
                          defaultValue={event.opponentSchool ?? ""}
                          className="rounded-lg border border-[var(--border)] px-3 py-2"
                          placeholder="Dual only"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                    <form action={deleteEventAction} className="mt-2 inline-block">
                      <input type="hidden" name="id" value={event.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--danger-red)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--danger-red)]"
                      >
                        Delete Event
                      </button>
                    </form>
                  </details>
                )}
              </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--neutral-gray)]">
            No events logged yet. Add the next dual or tournament above.
          </p>
        )}
      </section>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const outcomeLabels: Record<MatchOutcomeType, string> = {
  decision: "Decision",
  major_decision: "Major Decision",
  tech_fall: "Tech Fall",
  fall: "Fall",
  forfeit: "Forfeit",
  injury: "Injury",
};

function formatOutcomeLabel(outcome?: MatchOutcomeType) {
  if (!outcome) return outcomeLabels.decision;
  return outcomeLabels[outcome] ?? outcomeLabels.decision;
}

interface DualScoreCardProps {
  summary: DualEventSummary;
  opponent: string;
}

function DualScoreCard({ summary, opponent }: DualScoreCardProps) {
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">
          Dual Score
        </p>
        <p className="text-base font-semibold text-[var(--brand-navy)]">
          Davidson {summary.ourScore} – {opponent} {summary.opponentScore}
        </p>
      </div>
      {summary.matches.length ? (
        <details className="mt-3 rounded-xl border border-dashed border-[var(--border)] p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-navy)]">
            Match Results
          </summary>
          <ul className="mt-3 space-y-3 text-sm">
            {summary.matches.map((match) => (
              <li
                key={match.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-[var(--brand-navy)]">
                    {match.weightClass ?? "—"} ·{" "}
                    {match.wrestlerName ?? `ID ${match.wrestlerId}`}
                  </p>
                  <p className="text-xs text-[var(--neutral-gray)]">
                    {match.result === "L" ? "Loss" : "Win"} ·{" "}
                    {formatOutcomeLabel(match.outcomeType ?? undefined)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--brand-navy)]">
                  {match.ourScore}-{match.opponentScore}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="mt-3 text-sm text-[var(--neutral-gray)]">
          No dual matches logged yet.
        </p>
      )}
    </div>
  );
}
