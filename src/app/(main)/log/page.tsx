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
      </header>
      <MatchLogger roster={roster} events={events} />
    </div>
  );
}
