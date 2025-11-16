import type {
  MatchLogPayload,
  MatchOutcomeType,
  MatchResult,
  MatchWithEvents,
} from "@/types/match";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockMatches } from "@/lib/analytics/mockData";
import type { Database } from "@/types/database";

export async function getRecentMatches(limit = 10): Promise<MatchWithEvents[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockMatches.slice(0, limit);
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*, match_events(*)")
    .order("date", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Recent matches query failed", error);
    return mockMatches.slice(0, limit);
  }

  return data.map((match) => ({
    id: match.id,
    wrestlerId: match.wrestler_id,
    eventId: match.event_id ?? undefined,
    opponentName: match.opponent_name,
    opponentSchool: match.opponent_school ?? undefined,
    weightClass: match.weight_class ?? undefined,
    matchType: match.match_type,
    eventName: match.event_name ?? undefined,
    outcomeType: match.outcome_type ?? undefined,
    date: match.date,
    result: match.result,
    ourScore: match.our_score,
    opponentScore: match.opponent_score,
    firstTakedownScorer: match.first_takedown_scorer,
    ourRidingTimeSeconds: match.our_riding_time_seconds,
    opponentRidingTimeSeconds: match.opponent_riding_time_seconds,
    events:
      match.match_events?.map((evt) => ({
        id: String(evt.id),
        matchId: evt.match_id,
        actionType: evt.action_type,
        periodOrder: evt.period_order,
        periodType: evt.period_type,
        periodNumber: evt.period_number,
        scorer: evt.scorer,
        attacker: evt.attacker ?? undefined,
        takedownType: evt.takedown_type ?? undefined,
        points: evt.points ?? undefined,
        createdAt: evt.created_at,
      })) ?? [],
  }));
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
      const { forUs, forThem } = calculateDualPoints(
        match.result,
        match.outcome_type as MatchOutcomeType | undefined,
      );
      ourScore += forUs;
      opponentScore += forThem;
      return {
        id: match.id,
        wrestlerId: match.wrestler_id,
        wrestlerName: match.wrestlers?.name ?? undefined,
        opponentName: match.opponent_name,
        weightClass: match.weight_class ?? undefined,
        result: match.result,
        outcomeType: match.outcome_type as MatchOutcomeType | undefined,
        ourScore: match.our_score ?? 0,
        opponentScore: match.opponent_score ?? 0,
      } satisfies DualMatchSummary;
    })
    .sort((a, b) => weightRank(a.weightClass) - weightRank(b.weightClass));

  return { matches, ourScore, opponentScore };
}
