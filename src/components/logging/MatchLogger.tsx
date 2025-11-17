"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import type { Wrestler } from "@/types/wrestler";
import type { MatchEvent, MatchSide, TakedownType } from "@/types/events";
import type { MatchMeta, MatchOutcomeType } from "@/types/match";
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
  { label: "Sudden Victory", type: "ot", number: 1, order: 4 },
  { label: "TB 1", type: "tb", number: 1, order: 5 },
  { label: "TB 2", type: "tb", number: 2, order: 6 },
];

type PromptState =
  | {
      mode: "takedown";
      scorer: MatchSide;
      actionType: "takedown" | "takedown_attempt";
    }
  | { mode: "nearfall"; scorer: MatchSide }
  | { mode: "stall"; scorer: MatchSide };

const takedownTypeOptions: Array<{ value: TakedownType; label: string }> = [
  { value: "double", label: "Double" },
  { value: "sweep_single", label: "Sweep Single" },
  { value: "low_single", label: "Low Single" },
  { value: "high_c", label: "High C" },
  { value: "throw", label: "Throw" },
  { value: "trip", label: "Trip" },
  { value: "ankle_pick", label: "Ankle Pick" },
  { value: "front_head", label: "Front Head" },
  { value: "slide_by", label: "Slide By" },
  { value: "sprawl_go_behind", label: "Sprawl Go Behind" },
  { value: "other", label: "Other" },
];

const shotAttemptOptions: Array<{ value: TakedownType; label: string }> = [
  { value: "double", label: "Double" },
  { value: "sweep_single", label: "Sweep Single" },
  { value: "low_single", label: "Low Single" },
  { value: "high_c", label: "High C" },
  { value: "throw", label: "Throw" },
  { value: "ankle_pick", label: "Ankle Pick" },
  { value: "slide_by", label: "Slide By" },
  { value: "other", label: "Other" },
];

function getTakedownLabel(value: TakedownType) {
  const option =
    takedownTypeOptions.find((opt) => opt.value === value) ??
    shotAttemptOptions.find((opt) => opt.value === value);
  if (option) return option.label;
  return value.replace(/_/g, " ");
}

const nearfallPoints: Array<2 | 3 | 4> = [2, 3, 4];
const outcomeOptions: Array<{ value: MatchOutcomeType; label: string }> = [
  { value: "decision", label: "Decision" },
  { value: "major_decision", label: "Major Decision" },
  { value: "tech_fall", label: "Tech Fall" },
  { value: "fall", label: "Fall" },
  { value: "forfeit", label: "Forfeit" },
  { value: "injury", label: "Injury" },
];

function formatOutcomeLabel(value?: MatchOutcomeType) {
  return outcomeOptions.find((option) => option.value === value)?.label ?? "Decision";
}

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MatchLogger({ roster, events: availableEvents }: Props) {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [loggedEvents, setLoggedEvents] = useState<MatchEvent[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [lastTakedownType, setLastTakedownType] =
    useState<TakedownType>("double");
  const [draftResult, setDraftResult] = useState<MatchMeta["result"]>("W");
  const [draftOutcomeType, setDraftOutcomeType] =
    useState<MatchOutcomeType>("decision");
  const [isPending, startTransition] = useTransition();

  const defaultWrestlerId = roster[0]?.id ?? 0;
  const defaultEvent = availableEvents[0] ?? null;
  const [matchMeta, setMatchMeta] = useState<MatchMeta>({
    wrestlerId: defaultWrestlerId,
    opponentName: "",
    opponentSchool: "",
    weightClass: roster[0]?.primaryWeightClass ?? "",
    matchType: defaultEvent?.type ?? "dual",
    eventId: defaultEvent?.id ?? null,
    eventName: defaultEvent?.name ?? "",
    outcomeType: "decision",
    date: defaultEvent?.date ?? new Date().toISOString().slice(0, 10),
    result: "W",
    ourScore: 0,
    opponentScore: 0,
    firstTakedownScorer: "none",
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

    if (actionType === "riding_time") {
      addEvent({ actionType, scorer, points: 1 });
      return;
    }

    if (actionType === "stall_call") {
      setPrompt({ mode: "stall", scorer });
      return;
    }

    if (actionType === "ride_out") {
      addEvent({ actionType, scorer });
      return;
    }

    if (actionType === "escape") {
      addEvent({ actionType, scorer, points: 1 });
      return;
    }

    if (actionType === "reversal") {
      addEvent({ actionType, scorer, points: 2 });
      return;
    }

    addEvent({ actionType, scorer });
  };

  const handlePromptSelect = (value: TakedownType | 0 | 1 | 2 | 3 | 4) => {
    if (!prompt) return;

    if (prompt.mode === "takedown") {
      const takedownType = value as TakedownType;
      setLastTakedownType(takedownType);
      addEvent({
        actionType: prompt.actionType,
        scorer: prompt.scorer,
        takedownType,
        attacker: prompt.scorer,
        points: prompt.actionType === "takedown" ? 3 : undefined,
      });
    } else if (prompt.mode === "nearfall") {
      addEvent({
        actionType: "nearfall",
        scorer: prompt.scorer,
        points: value as 2 | 3 | 4,
      });
    } else if (prompt.mode === "stall") {
      addEvent({
        actionType: "stall_call",
        scorer: prompt.scorer,
        points: value as 0 | 1 | 2,
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

  const openOutcomeModal = () => {
    setDraftResult(matchMeta.result === "L" ? "L" : "W");
    setDraftOutcomeType(matchMeta.outcomeType ?? "decision");
    setIsOutcomeModalOpen(true);
  };

  const handleOutcomeSave = () => {
    setMatchMeta((prev) => ({
      ...prev,
      result: draftResult === "L" ? "L" : "W",
      outcomeType: draftOutcomeType,
    }));
    setIsOutcomeModalOpen(false);
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
  const takedownPromptOptions =
    prompt?.mode === "takedown" && prompt.actionType === "takedown_attempt"
      ? shotAttemptOptions
      : takedownTypeOptions;

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
                  {wrestler.name}
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
          <div className="text-sm font-semibold text-[var(--brand-navy)]">
            <p>Event</p>
            {availableEvents.length ? (
              <Select
                className="mt-1"
                value={matchMeta.eventId ? String(matchMeta.eventId) : ""}
                onChange={(event) => handleEventSelect(event.target.value)}
              >
                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({formatDateLabel(event.date)})
                  </option>
                ))}
              </Select>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-normal text-[var(--neutral-gray)]">
                Create an event before logging matches.
              </p>
            )}
          </div>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Event Date
            <Input
              type="date"
              className="mt-1"
              value={matchMeta.date}
              disabled
            />
          </label>
          <label className="text-sm font-semibold text-[var(--brand-navy)]">
            Match Type
            <Select
              className="mt-1"
              value={matchMeta.matchType}
              disabled
            >
              <option value="dual">Dual</option>
              <option value="tournament">Tournament</option>
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
            Weight Class
            <Select
              className="mt-1"
              value={matchMeta.weightClass ?? ""}
              onChange={(event) =>
                handleMetaChange("weightClass", event.target.value)
              }
            >
              <option value="">Select weight</option>
              {["125","133","141","149","157","165","174","184","197","285"].map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </Select>
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

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
            Match Outcome
          </p>
          <p className="text-2xl font-semibold text-[var(--brand-navy)]">
            {matchMeta.result === "L" ? "Loss" : "Win"}
          </p>
          <p className="text-sm text-[var(--neutral-gray)]">
            {formatOutcomeLabel(matchMeta.outcomeType)}
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openOutcomeModal}>
          Match Outcome
        </Button>
      </div>

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

      {isOutcomeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setIsOutcomeModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Match Result
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(["W", "L"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraftResult(value)}
                  className={clsx(
                    "rounded-xl border px-4 py-3 text-lg font-semibold transition",
                    draftResult === value
                      ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
                      : "border-[var(--border)] text-[var(--brand-navy)] hover:border-[var(--brand-navy)]/60",
                  )}
                >
                  {value === "W" ? "Win" : "Loss"}
                </button>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Outcome Type
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {outcomeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraftOutcomeType(option.value)}
                  className={clsx(
                    "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                    draftOutcomeType === option.value
                      ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
                      : "border-[var(--border)] text-[var(--brand-navy)] hover:border-[var(--brand-red)]/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]"
                onClick={() => setIsOutcomeModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-[var(--brand-navy)] px-5 py-2 text-sm font-semibold text-white"
                onClick={handleOutcomeSave}
              >
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}

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
              {takedownPromptOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePromptSelect(option.value)}
                  className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--brand-navy)]"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-[var(--neutral-gray)]">
              Defaulting to {getTakedownLabel(lastTakedownType).toUpperCase()} next time.
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

      {prompt?.mode === "stall" && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={dismissPrompt}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Stall Call Points
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((value) => (
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
