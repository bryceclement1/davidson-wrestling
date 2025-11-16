import { listEvents } from "@/lib/db/events";
import { createEventAction, updateEventAction, deleteEventAction } from "./actions";
import { getAuthenticatedUser, assertRole } from "@/lib/auth/roles";

export default async function EventsPage() {
  const events = await listEvents();
  const user = await getAuthenticatedUser();
  const canManage = assertRole(user, "admin");

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
            {events.map((event) => (
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
            ))}
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
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  } catch (error) {
    return dateString;
  }
}
