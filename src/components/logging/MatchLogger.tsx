"use client";

import { useState, useTransition } from "react";
import type { Wrestler } from "@/types/wrestler";
import type { MatchEvent, MatchSide, TakedownType } from "@/types/events";
import type { MatchMeta } from "@/types/match";
import type { TeamEvent } from "@/types/event";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PeriodNavigator, type PeriodOption } from "./PeriodNavigator";
import { EventLoggerControls } from "./EventLoggerControls";
import { MatchEventList } from "./MatchEventList";
import { Modal } from "@/components/ui/Modal";
import { createMatchLog } from "@/app/(main)/log/actions";

interface Props {
  roster: Wrestler[];
  events: TeamEvent[];
}

const periodTemplate: PeriodOption[] = [
  { label: "Period 1", type: "reg", number: 1, order: 1 },
  { label: "Period 2", type: "reg", number: 2, order: 2 },
  { label: "Period 3", type: "reg", number: 3, order: 3 },
  { label: "OT 1", type: "ot", number: 1, order: 4 },
  { label: "TB 1", type: "tb", number: 1, order: 5 },
];

type PromptState =
  | {
      mode: "takedown";
      scorer: MatchSide;
      actionType: "takedown" | "takedown_attempt";
    }
  | { mode: "nearfall"; scorer: MatchSide };

const takedownTypes: TakedownType[] = [
  "single",
  "double",
  "high_c",
  "ankle_pick",
  "throw",
  "trip",
  "other",
];

const nearfallPoints: Array<2 | 3 | 4> = [2, 3, 4];

export function MatchLogger({ roster, events: availableEvents }: Props) {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [loggedEvents, setLoggedEvents] = useState<MatchEvent[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [lastTakedownType, setLastTakedownType] =
    useState<TakedownType>("single");
  const [isPending, startTransition] = useTransition();

  const defaultWrestlerId = roster[0]?.id ?? 0;
  const [matchMeta, setMatchMeta] = useState<MatchMeta>({
    wrestlerId: defaultWrestlerId,
    opponentName: "",
    opponentSchool: "",
    weightClass: roster[0]?.primaryWeightClass ?? "",
    matchType: "dual",
    eventId: null,
    eventName: "",
    date: new Date().toISOString().slice(0, 10),
    result: "W",
    ourScore: 0,
    opponentScore: 0,
    firstTakedownScorer: "us",
    ourRidingTimeSeconds: 0,
    opponentRidingTimeSeconds: 0,
  });

  const currentPeriod = periodTemplate[periodIndex];

  const handleMetaChange = <K extends keyof MatchMeta>(
    key: K,
    value: MatchMeta[K],
  ) => {
    setMatchMeta((prev) => ({ ...prev, [key]: value }));
  };

  const addEvent = (event: Partial<MatchEvent>) => {
    const id = crypto.randomUUID();
    const payload: MatchEvent = {
      id,
      actionType: event.actionType!,
      periodOrder: event.periodOrder ?? currentPeriod.order,
      periodType: currentPeriod.type,
      periodNumber: currentPeriod.number,
      scorer: event.scorer ?? "us",
      attacker: event.attacker,
      takedownType: event.takedownType,
      points: event.points as MatchEvent["points"],
    };

    setLoggedEvents((prev) => [...prev, payload]);
    setPrompt(null);
  };

  const handleEventClick = (actionType: MatchEvent["actionType"], scorer: MatchSide) => {
    if (actionType === "takedown" || actionType === "takedown_attempt") {
      setPrompt({ mode: "takedown", scorer, actionType });
      return;
    }

    if (actionType === "nearfall") {
      setPrompt({ mode: "nearfall", scorer });
      return;
    }

    addEvent({ actionType, scorer });
  };

  const handlePromptSelect = (value: TakedownType | 2 | 3 | 4) => {
    if (!prompt) return;

    if (prompt.mode === "takedown") {
      const takedownType = value as TakedownType;
      setLastTakedownType(takedownType);
      addEvent({
        actionType: prompt.actionType,
        scorer: prompt.scorer,
        takedownType,
        attacker: prompt.scorer,
      });
    } else if (prompt.mode === "nearfall") {
      addEvent({
        actionType: "nearfall",
        scorer: prompt.scorer,
        points: value as 2 | 3 | 4,
      });
    }
  };

  const removeEvent = (id: string) => {
    setLoggedEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const handleEventSelect = (eventIdValue: string) => {
    if (!eventIdValue) {
      setMatchMeta((prev) => ({
        ...prev,
        eventId: null,
        eventName: "",
      }));
      return;
    }

    const selected = availableEvents.find(
      (event) => String(event.id) === eventIdValue,
    );

    if (selected) {
      setMatchMeta((prev) => ({
        ...prev,
        eventId: selected.id,
        eventName: selected.name,
        matchType: selected.type,
        date: selected.date,
        opponentSchool:
          selected.type === "dual" && selected.opponentSchool
            ? selected.opponentSchool
            : prev.opponentSchool,
      }));
    }
  };

  const handleSave = () => {
    setIsConfirmOpen(false);
    setStatusMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await createMatchLog({ match: matchMeta, events: loggedEvents });
        setStatusMessage("Match saved to Supabase.");
        setLoggedEvents([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save match.");
      }
    });
  };

  const dismissPrompt = () => setPrompt(null);

  const takedownPrompt = prompt?.mode === "takedown";
  const nearfallPrompt = prompt?.mode === "nearfall";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Wrestler
            <Select
              value={String(matchMeta.wrestlerId)}
              onChange={(event) =>
                handleMetaChange("wrestlerId", Number(event.target.value))
              }
              className="mt-1"
            >
              {roster.map((wrestler) => (
                <option key={wrestler.id} value={wrestler.id}>
                  {wrestler.name} · {wrestler.primaryWeightClass ?? "—"}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Opponent
            <Input
              className="mt-1"
              value={matchMeta.opponentName}
              placeholder="Opponent Name"
              onChange={(event) =>
                handleMetaChange("opponentName", event.target.value)
              }
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Opponent School
            <Input
              className="mt-1"
              value={matchMeta.opponentSchool}
              placeholder="School / Club"
              onChange={(event) =>
                handleMetaChange("opponentSchool", event.target.value)
              }
            />
          </label>
          {availableEvents.length > 0 && (
            <label className="text-sm font-semibold text-[var(--brand-navy)]">
              Linked Event
              <Select
                className="mt-1"
                value={matchMeta.eventId ? String(matchMeta.eventId) : ""}
                onChange={(event) => handleEventSelect(event.target.value)}
              >
                <option value="">None / Custom</option>
                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.type === "dual" ? "Dual" : "Tournament"})
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Event Date
            <Input
              type="date"
              className="mt-1"
              value={matchMeta.date}
              onChange={(event) => handleMetaChange("date", event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Event Name
            <Input
              className="mt-1"
              placeholder="Optional if linked above"
              value={matchMeta.eventName ?? ""}
              onChange={(event) =>
                handleMetaChange("eventName", event.target.value)
              }
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Match Type
            <Select
              className="mt-1"
              value={matchMeta.matchType}
              onChange={(event) =>
                handleMetaChange("matchType", event.target.value as MatchMeta["matchType"])
              }
            >
              <option value="dual">Dual</option>
              <option value="tournament">Tournament</option>
            </Select>
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Result
            <Select
              className="mt-1"
              value={matchMeta.result}
              onChange={(event) =>
                handleMetaChange("result", event.target.value as MatchMeta["result"])
              }
            >
              <option value="W">Win</option>
              <option value="L">Loss</option>
              <option value="D">Draw</option>
              <option value="FF">Forfeit</option>
            </Select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Our Score
            <Input
              type="number"
              className="mt-1"
              value={matchMeta.ourScore}
              onChange={(event) =>
                handleMetaChange("ourScore", Number(event.target.value))
              }
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Opponent Score
            <Input
              type="number"
              className="mt-1"
              value={matchMeta.opponentScore}
              onChange={(event) =>
                handleMetaChange("opponentScore", Number(event.target.value))
              }
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            First Takedown By
            <Select
              className="mt-1"
              value={matchMeta.firstTakedownScorer}
              onChange={(event) =>
                handleMetaChange(
                  "firstTakedownScorer",
                  event.target.value as MatchMeta["firstTakedownScorer"],
                )
              }
            >
              <option value="us">Davidson</option>
              <option value="opponent">Opponent</option>
              <option value="none">None</option>
            </Select>
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Weight Class
            <Input
              className="mt-1"
              value={matchMeta.weightClass}
              onChange={(event) =>
                handleMetaChange("weightClass", event.target.value)
              }
            />
          </label>
        </div>
      </div>

      <PeriodNavigator
        options={periodTemplate}
        currentIndex={periodIndex}
        onPrev={() => setPeriodIndex(Math.max(0, periodIndex - 1))}
        onNext={() =>
          setPeriodIndex(Math.min(periodTemplate.length - 1, periodIndex + 1))
        }
        onSelect={setPeriodIndex}
      />

      <EventLoggerControls onEvent={handleEventClick} />

      <MatchEventList events={loggedEvents} onRemove={removeEvent} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {statusMessage && (
            <p className="text-sm text-[var(--success-green)]">
              {statusMessage}
            </p>
          )}
          {error && (
            <p className="text-sm text-[var(--danger-red)]">{error}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setLoggedEvents([]);
              setStatusMessage(null);
            }}
          >
            Clear Session
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsConfirmOpen(true)}
            disabled={!loggedEvents.length}
          >
            Save Match / Finalize
          </Button>
        </div>
      </div>

      <Modal
        title="Confirm Save?"
        description="Are you sure you want to finalize this match log? Post-save edits require Admin access."
        confirmLabel={isPending ? "Saving..." : "Save Match"}
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />

      {takedownPrompt && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={dismissPrompt}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Takedown Type
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {takedownTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handlePromptSelect(type)}
                  className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold capitalize text-[var(--brand-navy)]"
                >
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-[var(--neutral-gray)]">
              Defaulting to {lastTakedownType.toUpperCase()} next time.
            </p>
            <div className="mt-4 text-right">
              <button
                type="button"
                className="text-sm font-semibold text-[var(--neutral-gray)]"
                onClick={dismissPrompt}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {nearfallPrompt && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={dismissPrompt}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Nearfall Points
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {nearfallPoints.map((value) => (
                <button
                  key={value}
                  onClick={() => handlePromptSelect(value)}
                  className="rounded-xl border border-[var(--border)] px-4 py-3 text-lg font-semibold text-[var(--brand-navy)]"
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button
                type="button"
                className="text-sm font-semibold text-[var(--neutral-gray)]"
                onClick={dismissPrompt}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
