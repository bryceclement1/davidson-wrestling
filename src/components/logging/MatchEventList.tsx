"use client";

import type { MatchEvent } from "@/types/events";
import { X } from "lucide-react";

interface Props {
  events: MatchEvent[];
  onRemove: (id: string) => void;
}

const labelMap: Record<MatchEvent["actionType"], string> = {
  takedown: "Takedown",
  takedown_attempt: "Shot Attempt",
  escape: "Escape",
  reversal: "Reversal",
  nearfall: "Nearfall",
};

export function MatchEventList({ events, onRemove }: Props) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-5 py-4 text-sm text-[var(--neutral-gray)]">
        Events will appear here as you log them.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm"
        >
          <div>
            <p className="font-semibold text-[var(--brand-navy)]">
              {labelMap[event.actionType]} • Period {event.periodNumber}
            </p>
            <p className="text-xs text-[var(--neutral-gray)]">
              {event.scorer === "us" ? "Davidson" : "Opponent"}
              {event.takedownType && ` · ${event.takedownType}`}
              {event.points && ` · ${event.points}pts`}
            </p>
          </div>
          <button
            className="rounded-full bg-white p-1 text-[var(--danger-red)]"
            onClick={() => onRemove(event.id)}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
