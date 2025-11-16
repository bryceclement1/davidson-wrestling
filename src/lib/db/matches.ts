import type { MatchLogPayload, MatchWithEvents } from "@/types/match";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockMatches } from "@/lib/analytics/mockData";

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
