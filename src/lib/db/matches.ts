import type {
  MatchLogPayload,
  MatchOutcomeType,
  MatchResult,
  MatchType,
  MatchWithEvents,
} from "@/types/match";
import type { MatchEvent } from "@/types/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockMatches } from "@/lib/analytics/mockData";
import type { Database } from "@/types/database";

function deriveFirstTakedownFromDbEvents(
  events: Database["public"]["Tables"]["match_events"]["Row"][] | null | undefined,
  fallback?: Database["public"]["Tables"]["matches"]["Row"]["first_takedown_scorer"],
): "us" | "opponent" | "none" | undefined {
  const takedown = events
    ?.filter((event) => event.action_type === "takedown")
    .sort((a, b) => (a.period_order ?? 0) - (b.period_order ?? 0))[0];
  if (takedown && takedown.scorer !== "none") {
    return takedown.scorer as "us" | "opponent";
  }
  if (fallback && fallback !== "none") {
    return fallback as "us" | "opponent" | undefined;
  }
  return undefined;
}

type MatchRowWithWrestler = Database["public"]["Tables"]["matches"]["Row"] & {
  match_events?: Database["public"]["Tables"]["match_events"]["Row"][] | null;
  wrestlers?: { name?: string | null } | null;
};

export async function getRecentMatches(limit?: number): Promise<MatchWithEvents[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return typeof limit === "number" ? mockMatches.slice(0, limit) : mockMatches;
  }

  let query = supabase
    .from("matches")
    .select("*, match_events(*), wrestlers(name)")
    .order("date", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Recent matches query failed", error);
    return typeof limit === "number" ? mockMatches.slice(0, limit) : mockMatches;
  }

  return (data as MatchRowWithWrestler[]).map((match) => {
    const eventRows = match.match_events ?? [];
    const events =
      eventRows.map((evt) => ({
        id: String(evt.id),
        matchId: evt.match_id,
        actionType: evt.action_type as MatchEvent["actionType"],
        periodOrder: evt.period_order,
        periodType: evt.period_type as MatchEvent["periodType"],
        periodNumber: evt.period_number,
        scorer: evt.scorer as MatchEvent["scorer"],
        attacker: (evt.attacker ?? undefined) as MatchEvent["attacker"],
        takedownType: (evt.takedown_type ?? undefined) as MatchEvent["takedownType"],
        points: (evt.points ?? undefined) as MatchEvent["points"],
        createdAt: evt.created_at ?? undefined,
      })) ?? [];

    return {
      id: match.id,
      wrestlerId: match.wrestler_id,
      wrestlerName: match.wrestlers?.name ?? undefined,
      eventId: match.event_id ?? undefined,
      opponentName: match.opponent_name,
      opponentSchool: match.opponent_school ?? undefined,
      weightClass: match.weight_class ?? undefined,
      matchType: (match.match_type ?? "dual") as MatchType,
      eventName: match.event_name ?? undefined,
      outcomeType: (match.outcome_type ?? undefined) as MatchOutcomeType | undefined,
      date: match.date,
      result: (match.result ?? "W") as MatchResult,
      ourScore: match.our_score ?? 0,
      opponentScore: match.opponent_score ?? 0,
      firstTakedownScorer: deriveFirstTakedownFromDbEvents(
        eventRows,
        (match.first_takedown_scorer ?? undefined) as "us" | "opponent" | "none" | null | undefined,
      ),
      ourRidingTimeSeconds: match.our_riding_time_seconds ?? undefined,
      opponentRidingTimeSeconds: match.opponent_riding_time_seconds ?? undefined,
      events,
    };
  });
}

export async function persistMatchLog(payload: MatchLogPayload) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    console.info("Mock save (Supabase not configured)", payload);
    return { success: true };
  }

  const { data, error } = await supabase
    .from("matches")
    .insert({
      wrestler_id: payload.match.wrestlerId,
      opponent_name: payload.match.opponentName,
      opponent_school: payload.match.opponentSchool || null,
      weight_class: payload.match.weightClass,
      match_type: payload.match.matchType,
      event_id: payload.match.eventId ?? null,
      event_name: payload.match.eventName?.trim() || null,
      outcome_type: payload.match.outcomeType ?? "decision",
      date: payload.match.date,
      result: payload.match.result,
      our_score: payload.match.ourScore,
      opponent_score: payload.match.opponentScore,
      first_takedown_scorer: payload.match.firstTakedownScorer,
      our_riding_time_seconds: payload.match.ourRidingTimeSeconds,
      opponent_riding_time_seconds: payload.match.opponentRidingTimeSeconds,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create match", error);
    throw new Error("Unable to save match");
  }

  if (payload.events.length) {
    const eventPayload = payload.events.map((event, idx) => ({
      match_id: data.id,
      action_type: event.actionType,
      period_order: event.periodOrder ?? idx + 1,
      period_type: event.periodType,
      period_number: event.periodNumber,
      scorer: event.scorer,
      attacker: event.attacker,
      takedown_type: event.takedownType,
      points: event.points,
    }));

    const { error: eventsError } = await supabase
      .from("match_events")
      .insert(eventPayload);

    if (eventsError) {
      console.error("Failed to insert match events", eventsError);
      throw new Error("Unable to save match events");
    }
  }

  return { success: true };
}

export async function getMatchById(id: number): Promise<MatchWithEvents | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockMatches.find((match) => match.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*, match_events(*), wrestlers(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Match lookup failed", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    wrestlerId: data.wrestler_id,
    wrestlerName: data.wrestlers?.name ?? undefined,
    opponentName: data.opponent_name,
    opponentSchool: data.opponent_school ?? undefined,
    weightClass: data.weight_class ?? undefined,
    seasonId: data.season_id ?? undefined,
    matchType: (data.match_type ?? "dual") as MatchType,
    eventName: data.event_name ?? undefined,
    outcomeType: (data.outcome_type ?? undefined) as MatchOutcomeType | undefined,
    date: data.date,
    result: (data.result ?? "W") as MatchResult,
    ourScore: data.our_score ?? 0,
    opponentScore: data.opponent_score ?? 0,
    firstTakedownScorer: (data.first_takedown_scorer ?? undefined) as
      | "us"
      | "opponent"
      | "none"
      | undefined,
    ourRidingTimeSeconds: data.our_riding_time_seconds ?? undefined,
    opponentRidingTimeSeconds: data.opponent_riding_time_seconds ?? undefined,
    events:
      data.match_events?.map((evt) => ({
        id: String(evt.id),
        matchId: evt.match_id,
        actionType: evt.action_type as MatchEvent["actionType"],
        periodOrder: evt.period_order,
        periodType: evt.period_type as MatchEvent["periodType"],
        periodNumber: evt.period_number,
        scorer: evt.scorer as MatchEvent["scorer"],
        attacker: (evt.attacker ?? undefined) as MatchEvent["attacker"],
        takedownType: (evt.takedown_type ?? undefined) as MatchEvent["takedownType"],
        points: (evt.points ?? undefined) as MatchEvent["points"],
        createdAt: evt.created_at ?? undefined,
      })) ?? [],
  };
}

const dualOutcomePoints: Record<MatchOutcomeType, number> = {
  decision: 3,
  major_decision: 4,
  tech_fall: 5,
  fall: 6,
  forfeit: 6,
  injury: 6,
};

type MatchRow = Database["public"]["Tables"]["matches"]["Row"] & {
  wrestlers?: {
    name?: string | null;
  } | null;
};

export interface DualMatchSummary {
  id: number;
  wrestlerId: number;
  wrestlerName?: string;
  opponentName: string;
  weightClass?: string | null;
  result: MatchResult;
  outcomeType?: MatchOutcomeType | null;
  ourScore: number;
  opponentScore: number;
}

export interface DualEventSummary {
  matches: DualMatchSummary[];
  ourScore: number;
  opponentScore: number;
}

function calculateDualPoints(
  result: MatchResult,
  outcomeType?: MatchOutcomeType | null,
) {
  const points = dualOutcomePoints[outcomeType ?? "decision"] ?? 3;
  if (result === "W" || result === "FF") {
    return { forUs: points, forThem: 0 };
  }
  if (result === "L") {
    return { forUs: 0, forThem: points };
  }
  return { forUs: 0, forThem: 0 };
}

function weightRank(weightClass?: string | null) {
  if (!weightClass) return Number.MAX_SAFE_INTEGER;
  const numeric = parseInt(weightClass, 10);
  if (Number.isNaN(numeric)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return numeric;
}

export async function getDualEventSummary(
  eventId: number,
): Promise<DualEventSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { matches: [], ourScore: 0, opponentScore: 0 };
  }

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,wrestler_id,opponent_name,weight_class,result,outcome_type,match_type,our_score,opponent_score,wrestlers(name)",
    )
    .eq("event_id", eventId)
    .eq("match_type", "dual");

  if (error || !data) {
    console.error("Dual event query failed", error);
    return { matches: [], ourScore: 0, opponentScore: 0 };
  }

  let ourScore = 0;
  let opponentScore = 0;

  const matches = (data as MatchRow[])
    .map((match) => {
      const result = (match.result ?? "W") as MatchResult;
      const outcome = (match.outcome_type ?? undefined) as MatchOutcomeType | undefined;
      const { forUs, forThem } = calculateDualPoints(result, outcome);
      ourScore += forUs;
      opponentScore += forThem;
      return {
        id: match.id,
        wrestlerId: match.wrestler_id,
        wrestlerName: match.wrestlers?.name ?? undefined,
        opponentName: match.opponent_name,
        weightClass: match.weight_class ?? undefined,
        result,
        outcomeType: outcome,
        ourScore: match.our_score ?? 0,
        opponentScore: match.opponent_score ?? 0,
      } satisfies DualMatchSummary;
    })
    .sort((a, b) => weightRank(a.weightClass) - weightRank(b.weightClass));

  return { matches, ourScore, opponentScore };
}
