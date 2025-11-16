import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Wrestler } from "@/types/wrestler";
import type { MatchWithEvents } from "@/types/match";
import type { MatchEvent } from "@/types/events";
import type { WrestlerSeasonStats, WrestlerPeriodBreakdown } from "@/types/analytics";
import type { Database } from "@/types/database";
import { mockWrestlerStats } from "./mockData";

type WrestlerRow = Database["public"]["Tables"]["wrestlers"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"] & {
  match_events?: Database["public"]["Tables"]["match_events"]["Row"][] | null;
};

export async function getWrestlerSeasonStats(
  wrestlerId: number,
): Promise<WrestlerSeasonStats | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockWrestlerStats[wrestlerId] ?? null;
  }

  const [{ data: wrestlerRow, error: wrestlerError }, { data: matchRows, error: matchesError }] =
    await Promise.all([
      supabase.from("wrestlers").select("*").eq("id", wrestlerId).maybeSingle(),
      supabase
        .from("matches")
        .select("*, match_events(*)")
        .eq("wrestler_id", wrestlerId)
        .order("date", { ascending: false }),
    ]);

  if (wrestlerError || !wrestlerRow || matchesError || matchRows == null) {
    console.warn("Unable to load wrestler dashboard data", {
      wrestlerError,
      matchesError,
    });
    return mockWrestlerStats[wrestlerId] ?? null;
  }

  const matches = (matchRows as MatchRow[]).map(mapMatchRow);
  const { record, winPercentage } = summarizeRecord(matches);

  const stats: WrestlerSeasonStats = {
    wrestler: mapWrestler(wrestlerRow),
    record,
    winPercentage,
    totalPointsFor: matches.reduce((sum, match) => sum + (match.ourScore ?? 0), 0),
    totalPointsAgainst: matches.reduce((sum, match) => sum + (match.opponentScore ?? 0), 0),
    firstTakedownWinPct: calculateFirstTakedownWinPct(matches),
    ridingTimeAdvantagePct: calculateRidingTimeAdvantagePct(matches),
    matches,
    periods: buildPeriodBreakdown(matches),
  };

  return stats;
}

function mapWrestler(row: WrestlerRow): Wrestler {
  return {
    id: row.id,
    name: row.name,
    classYear: row.class_year ?? undefined,
    primaryWeightClass: row.primary_weight_class ?? undefined,
    active: row.active,
    userId: row.user_id,
  };
}

function mapMatchRow(row: MatchRow): MatchWithEvents {
  const events = (row.match_events ?? [])
    .map(mapEventRow)
    .sort((a, b) => a.periodOrder - b.periodOrder);

  return {
    id: row.id,
    wrestlerId: row.wrestler_id,
    eventId: row.event_id ?? undefined,
    opponentName: row.opponent_name,
    opponentSchool: row.opponent_school ?? undefined,
    weightClass: row.weight_class ?? undefined,
    seasonId: row.season_id ?? undefined,
    matchType: row.match_type,
    eventName: row.event_name ?? undefined,
    outcomeType: row.outcome_type ?? undefined,
    date: row.date,
    result: row.result,
    ourScore: row.our_score ?? 0,
    opponentScore: row.opponent_score ?? 0,
    firstTakedownScorer: row.first_takedown_scorer ?? undefined,
    ourRidingTimeSeconds: row.our_riding_time_seconds ?? undefined,
    opponentRidingTimeSeconds: row.opponent_riding_time_seconds ?? undefined,
    events,
  };
}

function mapEventRow(
  row: Database["public"]["Tables"]["match_events"]["Row"],
): MatchEvent {
  return {
    id: String(
      row.id ??
        `${row.match_id}-${row.period_order}-${row.period_type}-${row.action_type}`,
    ),
    matchId: row.match_id,
    actionType: row.action_type,
    periodOrder: row.period_order,
    periodType: row.period_type,
    periodNumber: row.period_number,
    scorer: row.scorer,
    attacker: row.attacker ?? undefined,
    takedownType: row.takedown_type ?? undefined,
    points: (row.points as MatchEvent["points"]) ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

function summarizeRecord(matches: MatchWithEvents[]) {
  const wins = matches.filter((match) => match.result === "W" || match.result === "FF").length;
  const losses = matches.filter((match) => match.result === "L").length;
  const draws = matches.filter((match) => match.result === "D").length;
  const record =
    draws > 0 ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`;
  const winPercentage = matches.length > 0 ? wins / matches.length : 0;
  return { record, winPercentage };
}

function calculateFirstTakedownWinPct(matches: MatchWithEvents[]) {
  const attempts = matches.filter((match) => match.firstTakedownScorer === "us");
  if (!attempts.length) return 0;
  const wins = attempts.filter(
    (match) => match.result === "W" || match.result === "FF",
  ).length;
  return wins / attempts.length;
}

function calculateRidingTimeAdvantagePct(matches: MatchWithEvents[]) {
  if (!matches.length) return 0;
  const withAdvantage = matches.filter(
    (match) =>
      (match.ourRidingTimeSeconds ?? 0) >
      (match.opponentRidingTimeSeconds ?? 0),
  ).length;
  return withAdvantage / matches.length;
}

function buildPeriodBreakdown(
  matches: MatchWithEvents[],
): WrestlerPeriodBreakdown[] {
  const periodMap = new Map<string, WrestlerPeriodBreakdown>();

  matches.forEach((match) => {
    match.events.forEach((event) => {
      const key = `${event.periodType}-${event.periodNumber}`;
      let summary = periodMap.get(key);
      if (!summary) {
        summary = {
          periodLabel: formatPeriodLabel(event.periodType, event.periodNumber),
          periodOrder: getPeriodOrder(event.periodType, event.periodNumber),
          takedownsFor: 0,
          takedownsAgainst: 0,
          attemptsFor: 0,
          attemptsAgainst: 0,
          pointsDifferential: 0,
        };
        periodMap.set(key, summary);
      }

      if (event.actionType === "takedown") {
        if (event.scorer === "us") summary.takedownsFor += 1;
        if (event.scorer === "opponent") summary.takedownsAgainst += 1;
      }

      if (event.actionType === "takedown_attempt") {
        if (event.attacker === "us") summary.attemptsFor += 1;
        if (event.attacker === "opponent") summary.attemptsAgainst += 1;
      }

      if (event.points) {
        if (event.scorer === "us") {
          summary.pointsDifferential += event.points;
        } else if (event.scorer === "opponent") {
          summary.pointsDifferential -= event.points;
        }
      }
    });
  });

  return Array.from(periodMap.values()).sort(
    (a, b) => a.periodOrder - b.periodOrder,
  );
}

function formatPeriodLabel(periodType: MatchEvent["periodType"], periodNumber: number) {
  if (periodType === "reg") return `Period ${periodNumber}`;
  if (periodType === "ot") return `OT ${periodNumber}`;
  return `TB ${periodNumber}`;
}

function getPeriodOrder(periodType: MatchEvent["periodType"], periodNumber: number) {
  if (periodType === "reg") return periodNumber;
  if (periodType === "ot") return 100 + periodNumber;
  return 200 + periodNumber;
}
