"use client";

import type { ActionType, MatchSide } from "@/types/events";
import { Button } from "@/components/ui/Button";

interface Props {
  onEvent: (action: ActionType, scorer: MatchSide) => void;
}

const controls: { action: ActionType; label: string }[] = [
  { action: "takedown", label: "Takedown" },
  { action: "takedown_attempt", label: "Shot Attempt" },
  { action: "escape", label: "Escape" },
  { action: "reversal", label: "Reversal" },
  { action: "nearfall", label: "Nearfall" },
  { action: "riding_time", label: "Riding Time Point" },
  { action: "stall_call", label: "Stall Call" },
  { action: "caution", label: "Caution" },
] as const;

const sides: { scorer: MatchSide; label: string }[] = [
  { scorer: "us", label: "Us" },
  { scorer: "opponent", label: "Them" },
];

export function EventLoggerControls({ onEvent }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {controls.map((control) => (
        <div
          key={control.action}
          className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-[var(--brand-navy)]">
            {control.label}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {sides.map((side) => (
              <Button
                key={side.scorer}
                variant={side.scorer === "us" ? "primary" : "secondary"}
                size="lg"
                onClick={() => onEvent(control.action, side.scorer)}
              >
                {side.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
