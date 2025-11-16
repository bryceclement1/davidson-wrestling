import { getRoster } from "@/lib/db/wrestlers";
import { MatchLogger } from "@/components/logging/MatchLogger";
import { listEvents } from "@/lib/db/events";

export default async function MatchLogPage() {
  const roster = await getRoster();
  const events = await listEvents();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Match Logging
        </p>
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          Period-aware logging for Davidson matches
        </h2>
        <p className="text-sm text-[var(--neutral-gray)]">
          Large tap targets, quick takedown type selection, and confirmation
          before saving ensure clean data from the mat.
        </p>
      </header>
      <MatchLogger roster={roster} events={events} />
    </div>
  );
}
