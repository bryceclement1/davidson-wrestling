import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  LeaderboardEntry,
  PeriodPointsAverages,
  StallPeriodBreakdown,
  TeamDashboardData,
} from "@/types/analytics";
import type { MatchEvent } from "@/types/events";
import type { MatchWithEvents } from "@/types/match";
import type { Database } from "@/types/database";
import { mockMatches } from "./mockData";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"] & {
  match_events?: Database["public"]["Tables"]["match_events"]["Row"][] | null;
  wrestlers?: {
    name?: string | null;
  } | null;
};

const DEFAULT_SEASON_LABEL = "Training Season";

const ACTION_POINT_DEFAULTS: Partial<Record<MatchEvent["actionType"], number>> = {
  takedown: 3,
  takedown_attempt: 0,
  escape: 1,
  reversal: 2,
  nearfall: 2,
  riding_time: 1,
  stall_call: 0,
  caution: 0,
  ride_out: 0,
};

export async function getTeamDashboardData(): Promise<TeamDashboardData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return buildTeamDashboardData(mockMatches, DEFAULT_SEASON_LABEL);
  }

  try {
    const { data: season } = await supabase
      .from("seasons")
      .select("*")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let matchesQuery = supabase
      .from("matches")
      .select("*, match_events(*), wrestlers(name)")
      .order("date", { ascending: false });

    if (season?.id) {
      matchesQuery = matchesQuery.eq("season_id", season.id);
    }

    const { data, error } = await matchesQuery;

    if (error || !data) {
      throw error;
    }

    const matches = (data as MatchRow[]).map(mapMatchRow);

    return buildTeamDashboardData(matches, season?.name ?? "Current Season");
  } catch (error) {
    console.error("Team dashboard query failed", error);
    return buildTeamDashboardData(mockMatches, DEFAULT_SEASON_LABEL);
  }
}

function mapMatchRow(row: MatchRow): MatchWithEvents {
  const events =
    row.match_events?.map((evt) => ({
      id: String(
        evt.id ??
          `${evt.match_id}-${evt.period_order}-${evt.period_type}-${evt.action_type}`,
      ),
      matchId: evt.match_id,
      actionType: evt.action_type,
      periodOrder: evt.period_order,
      periodType: evt.period_type,
      periodNumber: evt.period_number,
      scorer: evt.scorer,
      attacker: evt.attacker ?? undefined,
      takedownType: evt.takedown_type ?? undefined,
      points: evt.points ?? undefined,
      createdAt: evt.created_at ?? undefined,
    })) ?? [];

  return {
    id: row.id,
    wrestlerId: row.wrestler_id,
    wrestlerName: row.wrestlers?.name ?? undefined,
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
    firstTakedownScorer: deriveFirstTakedownFromEvents(
      events,
      row.first_takedown_scorer,
    ),
    ourRidingTimeSeconds: row.our_riding_time_seconds ?? undefined,
    opponentRidingTimeSeconds: row.opponent_riding_time_seconds ?? undefined,
    events,
  };
}

interface MatchAnalysis {
  escapes: { us: number; opponent: number };
  nearfallPoints: { us: number; opponent: number };
  takedowns: { us: number; opponent: number };
  attempts: { us: number; opponent: number };
  reversals: { us: number; opponent: number };
  rideOuts: { us: number; opponent: number };
  stallCalls: { us: number; opponent: number };
  stallByPeriod: Map<string, StallPeriodBreakdown>;
  periodPoints: Map<string, PeriodPointsAverages>;
  ridingTimePoint: { us: boolean; opponent: boolean };
  zeroEscapes: boolean;
  hadReg1Data: boolean;
  hadReg2Data: boolean;
  afterP1: { us: number; opponent: number };
  afterP2: { us: number; opponent: number };
  overtime: boolean;
}

function deriveFirstTakedownFromEvents(
  events: MatchEvent[],
  fallback?: "us" | "opponent" | "none" | null,
) {
  const takedownEvent = events
    .filter((event) => event.actionType === "takedown")
    .sort((a, b) => a.periodOrder - b.periodOrder)[0];
  if (takedownEvent && takedownEvent.scorer !== "none") {
    return takedownEvent.scorer;
  }
  if (fallback && fallback !== "none") {
    return fallback;
  }
  return undefined;
}

function determineFirstTakedown(match: MatchWithEvents) {
  return deriveFirstTakedownFromEvents(match.events, match.firstTakedownScorer) ?? null;
}

function analyzeMatch(match: MatchWithEvents): MatchAnalysis {
  const escapes = { us: 0, opponent: 0 };
  const nearfallPoints = { us: 0, opponent: 0 };
  const takedowns = { us: 0, opponent: 0 };
  const attempts = { us: 0, opponent: 0 };
  const reversals = { us: 0, opponent: 0 };
  const rideOuts = { us: 0, opponent: 0 };
  const stallCalls = { us: 0, opponent: 0 };
  const stallByPeriod = new Map<string, StallPeriodBreakdown>();
  const periodPoints = new Map<string, PeriodPointsAverages>();
  let ridingTimePointUs = false;
  let ridingTimePointOpponent = false;
  let overtime = false;

  match.events.forEach((event) => {
    const key = getPeriodKey(event.periodType, event.periodNumber);
    const label = formatPeriodLabel(event.periodType, event.periodNumber);
    const order = getPeriodOrder(event.periodType, event.periodNumber);

    const periodEntry =
      periodPoints.get(key) ??
      {
        label,
        order,
        us: 0,
        opponent: 0,
      };

    const points = getEventPoints(event);

    if (event.scorer === "us") {
      periodEntry.us += points;
    } else if (event.scorer === "opponent") {
      periodEntry.opponent += points;
    }

    periodPoints.set(key, periodEntry);

    if (event.actionType === "escape") {
      if (event.scorer === "us") escapes.us += 1;
      if (event.scorer === "opponent") escapes.opponent += 1;
    }

    if (event.actionType === "nearfall") {
      if (event.scorer === "us") nearfallPoints.us += points;
      if (event.scorer === "opponent") nearfallPoints.opponent += points;
    }

    if (event.actionType === "takedown") {
      if (event.scorer === "us") takedowns.us += 1;
      if (event.scorer === "opponent") takedowns.opponent += 1;
    }

    if (event.actionType === "takedown_attempt") {
      if (event.attacker === "us") attempts.us += 1;
      if (event.attacker === "opponent") attempts.opponent += 1;
    }

    if (event.actionType === "reversal") {
      if (event.scorer === "us") reversals.us += 1;
      if (event.scorer === "opponent") reversals.opponent += 1;
    }

    if (event.actionType === "ride_out") {
      if (event.scorer === "us") rideOuts.us += 1;
      if (event.scorer === "opponent") rideOuts.opponent += 1;
    }

    if (event.actionType === "riding_time") {
      if (event.scorer === "us") ridingTimePointUs = true;
      if (event.scorer === "opponent") ridingTimePointOpponent = true;
    }

    if (event.actionType === "stall_call") {
      if (event.scorer === "us") stallCalls.us += 1;
      if (event.scorer === "opponent") stallCalls.opponent += 1;
      let stallEntry = stallByPeriod.get(key);
      if (!stallEntry) {
        stallEntry = {
          label,
          order,
          us: 0,
          opponent: 0,
          matchesLogged: 1,
        };
      }
      if (event.scorer === "us") {
        stallEntry.us += 1;
      } else if (event.scorer === "opponent") {
        stallEntry.opponent += 1;
      }
      stallByPeriod.set(key, stallEntry);
    }

    if (event.periodType !== "reg") {
      overtime = true;
    }
  });

  const reg1 = periodPoints.get("reg-1");
  const reg2 = periodPoints.get("reg-2");
  const playedRegPeriods = new Set(
    match.events
      .filter((event) => event.periodType === "reg")
      .map((event) => event.periodNumber),
  );
  const reachedReg1 =
    playedRegPeriods.has(1) ||
    playedRegPeriods.has(2) ||
    playedRegPeriods.has(3);
  const reachedReg2 =
    playedRegPeriods.has(2) || playedRegPeriods.has(3);

  const afterP1 = {
    us: reg1?.us ?? 0,
    opponent: reg1?.opponent ?? 0,
  };
  const afterP2 = {
    us: afterP1.us + (reg2?.us ?? 0),
    opponent: afterP1.opponent + (reg2?.opponent ?? 0),
  };

  return {
    escapes,
    nearfallPoints,
    takedowns,
    attempts,
    reversals,
    rideOuts,
    stallCalls,
    stallByPeriod,
    periodPoints,
    ridingTimePoint: { us: ridingTimePointUs, opponent: ridingTimePointOpponent },
    zeroEscapes: escapes.us === 0,
    hadReg1Data: reachedReg1,
    hadReg2Data: reachedReg2,
    afterP1,
    afterP2,
    overtime,
  };
}

function buildTeamDashboardData(
  matches: MatchWithEvents[],
  seasonLabel: string,
): TeamDashboardData {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  let pointsFor = 0;
  let pointsAgainst = 0;

  let escapesFor = 0;
  let escapesAgainst = 0;
  let nearfallFor = 0;
  let nearfallAgainst = 0;
  let zeroEscapeMatches = 0;

  let takedownsFor = 0;
  let takedownsAgainst = 0;
  let attemptsFor = 0;
  let attemptsAgainst = 0;

  let reversalsFor = 0;
  let reversalsAgainst = 0;

  let rideOutsFor = 0;
  let rideOutsAgainst = 0;
  let ridingTimeMatchesFor = 0;
  let ridingTimeMatchesAgainst = 0;

  let stallCallsFor = 0;
  let stallCallsAgainst = 0;
  let decisionWins = 0;
  let majorDecisionWins = 0;
  let techFallWins = 0;
  let fallWins = 0;

  const stallByPeriodAggregate = new Map<string, StallPeriodBreakdown>();
  const pointsByPeriodAggregate = new Map<
    string,
    PeriodPointsAverages & { matches: number }
  >();

  const firstTakedown = { matches: 0, wins: 0 };
  const leadingAfterP1 = { matches: 0, wins: 0 };
  const trailingAfterP1 = { matches: 0, wins: 0 };
  const tiedHeadingIntoP3 = { matches: 0, wins: 0 };

  const overtimeMatches = { matches: 0, wins: 0 };
  const onePointMatches = { matches: 0, wins: 0 };
  const twoPointMatches = { matches: 0, wins: 0 };

  const winsByWrestler = new Map<
    number,
    { id: number; name: string; wins: number; matches: number }
  >();
  const takedownsByWrestler = new Map<
    number,
    { id: number; name: string; takedowns: number }
  >();

  matches.forEach((match) => {
    const isWin = match.result === "W" || match.result === "FF";
    const isLoss = match.result === "L";
    if (isWin) wins += 1;
    else if (isLoss) losses += 1;
    else draws += 1;

    pointsFor += match.ourScore ?? 0;
    pointsAgainst += match.opponentScore ?? 0;

    if (isWin) {
      const outcomeType = match.outcomeType ?? "decision";
      switch (outcomeType) {
        case "major_decision":
          majorDecisionWins += 1;
          break;
        case "tech_fall":
          techFallWins += 1;
          break;
        case "fall":
          fallWins += 1;
          break;
        case "decision":
        default:
          decisionWins += 1;
      }
    }

    const analysis = analyzeMatch(match);

    escapesFor += analysis.escapes.us;
    escapesAgainst += analysis.escapes.opponent;
    nearfallFor += analysis.nearfallPoints.us;
    nearfallAgainst += analysis.nearfallPoints.opponent;

    if (analysis.zeroEscapes) {
      zeroEscapeMatches += 1;
    }

    takedownsFor += analysis.takedowns.us;
    takedownsAgainst += analysis.takedowns.opponent;
    attemptsFor += analysis.attempts.us;
    attemptsAgainst += analysis.attempts.opponent;

    reversalsFor += analysis.reversals.us;
    reversalsAgainst += analysis.reversals.opponent;

    rideOutsFor += analysis.rideOuts.us;
    rideOutsAgainst += analysis.rideOuts.opponent;

    stallCallsFor += analysis.stallCalls.us;
    stallCallsAgainst += analysis.stallCalls.opponent;

    if (analysis.ridingTimePoint.us) ridingTimeMatchesFor += 1;
    if (analysis.ridingTimePoint.opponent) ridingTimeMatchesAgainst += 1;

    const firstTakedownWinner =
      match.firstTakedownScorer ?? determineFirstTakedown(match);
    if (firstTakedownWinner === "us") {
      firstTakedown.matches += 1;
      if (isWin) firstTakedown.wins += 1;
    }

    if (analysis.hadReg1Data) {
      if (analysis.afterP1.us > analysis.afterP1.opponent) {
        leadingAfterP1.matches += 1;
        if (isWin) leadingAfterP1.wins += 1;
      } else if (analysis.afterP1.us < analysis.afterP1.opponent) {
        trailingAfterP1.matches += 1;
        if (isWin) trailingAfterP1.wins += 1;
      }
    }

    if (analysis.hadReg2Data && analysis.afterP2.us === analysis.afterP2.opponent) {
      tiedHeadingIntoP3.matches += 1;
      if (isWin) tiedHeadingIntoP3.wins += 1;
    }

    if (analysis.overtime) {
      overtimeMatches.matches += 1;
      if (isWin) overtimeMatches.wins += 1;
    }

    const margin = Math.abs((match.ourScore ?? 0) - (match.opponentScore ?? 0));
    if (margin === 1) {
      onePointMatches.matches += 1;
      if (isWin) onePointMatches.wins += 1;
    }
    if (margin === 2) {
      twoPointMatches.matches += 1;
      if (isWin) twoPointMatches.wins += 1;
    }

    analysis.periodPoints.forEach((entry, key) => {
      const aggregate =
        pointsByPeriodAggregate.get(key) ?? {
          label: entry.label,
          order: entry.order,
          us: 0,
          opponent: 0,
          matches: 0,
        };
      aggregate.us += entry.us;
      aggregate.opponent += entry.opponent;
      aggregate.matches += 1;
      pointsByPeriodAggregate.set(key, aggregate);
    });

    analysis.stallByPeriod.forEach((entry, key) => {
      const aggregate =
        stallByPeriodAggregate.get(key) ?? {
          label: entry.label,
          order: entry.order,
          us: 0,
          opponent: 0,
          matchesLogged: 0,
        };
      aggregate.us += entry.us;
      aggregate.opponent += entry.opponent;
      aggregate.matchesLogged += entry.matchesLogged;
      stallByPeriodAggregate.set(key, aggregate);
    });

    const winsEntry =
      winsByWrestler.get(match.wrestlerId) ?? {
        id: match.wrestlerId,
        name: match.wrestlerName ?? `ID ${match.wrestlerId}`,
        wins: 0,
        matches: 0,
      };
    winsEntry.matches += 1;
    if (isWin) winsEntry.wins += 1;
    winsByWrestler.set(match.wrestlerId, winsEntry);

    const takedownEntry =
      takedownsByWrestler.get(match.wrestlerId) ?? {
        id: match.wrestlerId,
        name: match.wrestlerName ?? `ID ${match.wrestlerId}`,
        takedowns: 0,
      };
    takedownEntry.takedowns += analysis.takedowns.us;
    takedownsByWrestler.set(match.wrestlerId, takedownEntry);
  });

  const matchesLogged = matches.length;
  const record =
    draws > 0 ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`;

  const averagePointsByPeriod = Array.from(pointsByPeriodAggregate.values())
    .sort((a, b) => a.order - b.order)
    .map((entry) => ({
      label: entry.label,
      order: entry.order,
      us: entry.matches ? entry.us / entry.matches : 0,
      opponent: entry.matches ? entry.opponent / entry.matches : 0,
    }));

  const stallByPeriod = Array.from(stallByPeriodAggregate.values()).sort(
    (a, b) => a.order - b.order,
  );

  const leaderboards = {
    wins: buildLeaderboard(Array.from(winsByWrestler.values()), (row) => row.wins, (row) => ({
      id: row.id,
      label: row.name,
      value: `${row.wins}-${row.matches - row.wins}`,
      helper: `${row.matches} matches`,
    })),
    takedowns: buildLeaderboard(
      Array.from(takedownsByWrestler.values()),
      (row) => row.takedowns,
      (row) => ({
        id: row.id,
        label: row.name,
        value: row.takedowns.toString(),
      }),
    ),
  };

  const recentMatches = matches
    .slice()
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, 10);

  return {
    seasonLabel,
    matchesLogged,
    overall: {
      record,
      pointsFor,
      pointsAgainst,
      escapesFor,
      escapesAgainst,
      nearfallPointsFor: nearfallFor,
      nearfallPointsAgainst: nearfallAgainst,
      decisionWins,
      majorDecisionWins,
      techFallWins,
      fallWins,
    },
    outcomePredictors: {
      firstTakedownWinPct:
        firstTakedown.matches > 0
          ? firstTakedown.wins / firstTakedown.matches
          : 0,
      leadingAfterP1WinPct:
        leadingAfterP1.matches > 0
          ? leadingAfterP1.wins / leadingAfterP1.matches
          : 0,
      trailingAfterP1WinPct:
        trailingAfterP1.matches > 0
          ? trailingAfterP1.wins / trailingAfterP1.matches
          : 0,
      tiedHeadingIntoP3WinPct:
        tiedHeadingIntoP3.matches > 0
          ? tiedHeadingIntoP3.wins / tiedHeadingIntoP3.matches
          : 0,
      averagePointsByPeriod,
    },
    takedownEfficiency: {
      ourConversionPct:
        attemptsFor + takedownsFor > 0
          ? takedownsFor / (attemptsFor + takedownsFor)
          : 0,
      opponentConversionPct:
        attemptsAgainst + takedownsAgainst > 0
          ? takedownsAgainst / (attemptsAgainst + takedownsAgainst)
          : 0,
      ourAttempts: attemptsFor,
      opponentAttempts: attemptsAgainst,
    },
    topBottom: {
      zeroEscapePct:
        matches.length > 0 ? zeroEscapeMatches / matches.length : 0,
      rideOuts: { us: rideOutsFor, opponent: rideOutsAgainst },
      ridingTimePointPct: {
        us:
          matches.length > 0
            ? ridingTimeMatchesFor / matches.length
            : 0,
        opponent:
          matches.length > 0
            ? ridingTimeMatchesAgainst / matches.length
            : 0,
      },
      reversals: { us: reversalsFor, opponent: reversalsAgainst },
    },
    stall: {
      avgUs:
        matches.length > 0 ? stallCallsFor / matches.length : 0,
      avgOpponent:
        matches.length > 0 ? stallCallsAgainst / matches.length : 0,
      byPeriod: stallByPeriod,
    },
    clutch: {
      overtimeWinPct:
        overtimeMatches.matches > 0
          ? overtimeMatches.wins / overtimeMatches.matches
          : 0,
      onePointWinPct:
        onePointMatches.matches > 0
          ? onePointMatches.wins / onePointMatches.matches
          : 0,
      twoPointWinPct:
        twoPointMatches.matches > 0
          ? twoPointMatches.wins / twoPointMatches.matches
          : 0,
    },
    leaderboards,
    recentMatches,
  };
}

function buildLeaderboard<T>(
  rows: T[],
  accessor: (row: T) => number,
  formatter: (row: T) => LeaderboardEntry,
) {
  return rows
    .slice()
    .sort((a, b) => accessor(b) - accessor(a))
    .slice(0, 4)
    .map(formatter);
}

function getEventPoints(event: MatchEvent) {
  if (typeof event.points === "number") {
    return event.points;
  }
  return ACTION_POINT_DEFAULTS[event.actionType] ?? 0;
}

function getPeriodKey(type: MatchEvent["periodType"], number: number) {
  return `${type}-${number}`;
}

function getPeriodOrder(type: MatchEvent["periodType"], number: number) {
  if (type === "reg") return number;
  if (type === "ot") return 100 + number;
  return 200 + number;
}

function formatPeriodLabel(type: MatchEvent["periodType"], number: number) {
  if (type === "reg") return `Period ${number}`;
  if (type === "ot") return `OT ${number}`;
  return `TB ${number}`;
}
