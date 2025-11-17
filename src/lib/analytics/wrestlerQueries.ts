import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Wrestler } from "@/types/wrestler";
import type { MatchWithEvents } from "@/types/match";
import type { MatchEvent } from "@/types/events";
import type {
  PeriodPointsAverages,
  ShotAttemptsByPeriod,
  StallPeriodBreakdown,
  WrestlerPeriodBreakdown,
  WrestlerSeasonStats,
  WrestlerTakedownLeader,
} from "@/types/analytics";
import type { Database } from "@/types/database";
import { mockWrestlerStats } from "./mockData";

type WrestlerRow = Database["public"]["Tables"]["wrestlers"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"] & {
  match_events?: Database["public"]["Tables"]["match_events"]["Row"][] | null;
};

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

interface WrestlerInsights {
  record: string;
  winPercentage: number;
  overall: WrestlerSeasonStats["overall"];
  outcomePredictors: WrestlerSeasonStats["outcomePredictors"];
  takedownEfficiency: WrestlerSeasonStats["takedownEfficiency"];
  topBottom: WrestlerSeasonStats["topBottom"];
  stall: WrestlerSeasonStats["stall"];
  clutch: WrestlerSeasonStats["clutch"];
  recentMatches: MatchWithEvents[];
}

interface WrestlerMatchAnalysis {
  escapes: { us: number; opponent: number };
  nearfallPoints: { us: number; opponent: number };
  takedowns: { us: number; opponent: number };
  attempts: { us: number; opponent: number };
  reversals: { us: number; opponent: number };
  rideOuts: { us: number; opponent: number };
  stallCalls: { us: number; opponent: number };
  stallByPeriod: Map<string, StallPeriodBreakdown>;
  pointsByPeriod: Map<string, PeriodPointsAverages>;
  shotAttemptsByPeriod: Map<string, ShotAttemptsByPeriod>;
  takedownTypes: Map<string, number>;
  shotTypes: Map<string, number>;
  takedownsInP3: { us: number; opponent: number };
  ridingTimePoint: { us: boolean; opponent: boolean };
  hadReg1Data: boolean;
  hadReg2Data: boolean;
  afterP1: { us: number; opponent: number };
  afterP2: { us: number; opponent: number };
  overtime: boolean;
}

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
  const insights = buildWrestlerInsights(matches);

  const stats: WrestlerSeasonStats = {
    wrestler: mapWrestler(wrestlerRow),
    record: insights.record,
    winPercentage: insights.winPercentage,
    totalPointsFor: insights.overall.pointsFor,
    totalPointsAgainst: insights.overall.pointsAgainst,
    firstTakedownWinPct: insights.outcomePredictors.firstTakedownWinPct,
    ridingTimeAdvantagePct: calculateRidingTimeAdvantagePct(matches),
    matches,
    periods: buildPeriodBreakdown(matches),
    overall: insights.overall,
    outcomePredictors: insights.outcomePredictors,
    takedownEfficiency: insights.takedownEfficiency,
    topBottom: insights.topBottom,
    stall: insights.stall,
    clutch: insights.clutch,
    recentMatches: insights.recentMatches,
  };

  return stats;
}

function buildWrestlerInsights(matches: MatchWithEvents[]): WrestlerInsights {
  const insights = createEmptyInsights();

  if (!matches.length) {
    return insights;
  }

  const { record, winPercentage } = summarizeRecord(matches);
  insights.record = record;
  insights.winPercentage = winPercentage;

  let pointsFor = 0;
  let pointsAgainst = 0;
  let escapesFor = 0;
  let escapesAgainst = 0;
  let nearfallFor = 0;
  let nearfallAgainst = 0;
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
  let zeroEscapeMatches = 0;
  let decisionWins = 0;
  let majorDecisionWins = 0;
  let techFallWins = 0;
  let fallWins = 0;

  const takedownTypeCounts = new Map<string, number>();
  const shotTypeCounts = new Map<string, number>();
  const takedownsInP3 = { us: 0, opponent: 0 };

  const stallByPeriodAggregate = new Map<string, StallPeriodBreakdown>();
  const pointsByPeriodAggregate = new Map<
    string,
    PeriodPointsAverages & { matches: number }
  >();
  const shotAttemptsAggregate = new Map<
    string,
    { label: string; order: number; attempts: number }
  >();

  const firstTakedown = { matches: 0, wins: 0 };
  const leadingAfterP1 = { matches: 0, wins: 0 };
  const trailingAfterP1 = { matches: 0, wins: 0 };
  const tiedHeadingIntoP3 = { matches: 0, wins: 0 };
  const overtimeMatches = { matches: 0, wins: 0 };
  const threePointMatches = { matches: 0, wins: 0 };

  matches.forEach((match) => {
    const isWin = match.result === "W" || match.result === "FF";
    pointsFor += match.ourScore ?? 0;
    pointsAgainst += match.opponentScore ?? 0;

    const analysis = analyzeMatch(match);

    escapesFor += analysis.escapes.us;
    escapesAgainst += analysis.escapes.opponent;
    nearfallFor += analysis.nearfallPoints.us;
    nearfallAgainst += analysis.nearfallPoints.opponent;
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
    if (analysis.escapes.us === 0) zeroEscapeMatches += 1;

    takedownsInP3.us += analysis.takedownsInP3.us;
    takedownsInP3.opponent += analysis.takedownsInP3.opponent;

    analysis.takedownTypes.forEach((count, type) => {
      takedownTypeCounts.set(type, (takedownTypeCounts.get(type) ?? 0) + count);
    });
    analysis.shotTypes.forEach((count, type) => {
      shotTypeCounts.set(type, (shotTypeCounts.get(type) ?? 0) + count);
    });

    analysis.pointsByPeriod.forEach((entry, key) => {
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

    analysis.shotAttemptsByPeriod.forEach((entry, key) => {
      const aggregate =
        shotAttemptsAggregate.get(key) ?? {
          label: entry.label,
          order: entry.order,
          attempts: 0,
        };
      aggregate.attempts += entry.attempts;
      shotAttemptsAggregate.set(key, aggregate);
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

    if (match.firstTakedownScorer === "us") {
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
    if (margin === 3) {
      threePointMatches.matches += 1;
      if (isWin) threePointMatches.wins += 1;
    }
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
  });

  const matchCount = matches.length;

  const averagePointsByPeriod = ensureRegPeriodAveragePoints(
    Array.from(pointsByPeriodAggregate.values())
      .sort((a, b) => a.order - b.order)
      .map((entry) => ({
        label: entry.label,
        order: entry.order,
        us: matchCount ? entry.us / matchCount : 0,
        opponent: matchCount ? entry.opponent / matchCount : 0,
      })),
  );

  const shotAttemptsByPeriod = buildShotAttemptsByPeriod(
    shotAttemptsAggregate,
    matchCount,
  );

  insights.overall = {
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
  };

  insights.outcomePredictors = {
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
  };

  insights.takedownEfficiency = {
    ourConversionPct:
      takedownsFor + attemptsFor > 0
        ? takedownsFor / (takedownsFor + attemptsFor)
        : 0,
    opponentConversionPct:
      takedownsAgainst + attemptsAgainst > 0
        ? takedownsAgainst / (takedownsAgainst + attemptsAgainst)
        : 0,
    ourTakedowns: takedownsFor,
    ourAttempts: attemptsFor,
    mostCommonTakedown: buildMoveLeader(takedownTypeCounts, matchCount),
    mostCommonShot: buildMoveLeader(shotTypeCounts, matchCount),
    avgTakedownsInP3: {
      us: matchCount ? takedownsInP3.us / matchCount : 0,
      opponent: matchCount ? takedownsInP3.opponent / matchCount : 0,
    },
    shotAttemptsByPeriod,
  };

  insights.topBottom = {
    zeroEscapePct: matchCount ? zeroEscapeMatches / matchCount : 0,
    rideOutAvg: {
      us: matchCount ? rideOutsFor / matchCount : 0,
      opponent: matchCount ? rideOutsAgainst / matchCount : 0,
    },
    ridingTimePointPct: {
      us: matchCount ? ridingTimeMatchesFor / matchCount : 0,
      opponent: matchCount ? ridingTimeMatchesAgainst / matchCount : 0,
    },
    reversalsAvg: {
      us: matchCount ? reversalsFor / matchCount : 0,
      opponent: matchCount ? reversalsAgainst / matchCount : 0,
    },
    nearfallAvg: {
      us: matchCount ? nearfallFor / matchCount : 0,
      opponent: matchCount ? nearfallAgainst / matchCount : 0,
    },
  };

  const stallByPeriod = ensureRegPeriodStall(
    Array.from(stallByPeriodAggregate.values())
      .sort((a, b) => a.order - b.order)
      .map((entry) => ({
        label: entry.label,
        order: entry.order,
        matchesLogged: matchCount,
        us: matchCount ? entry.us / matchCount : 0,
        opponent: matchCount ? entry.opponent / matchCount : 0,
      })),
  );

  insights.stall = {
    avgUs: matchCount ? stallCallsFor / matchCount : 0,
    avgOpponent: matchCount ? stallCallsAgainst / matchCount : 0,
    byPeriod: stallByPeriod,
  };

  insights.clutch = {
    overtimeWinPct:
      overtimeMatches.matches > 0
        ? overtimeMatches.wins / overtimeMatches.matches
        : 0,
    threePointMarginWinPct:
      threePointMatches.matches > 0
        ? threePointMatches.wins / threePointMatches.matches
        : 0,
  };

  insights.recentMatches = matches
    .slice()
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  return insights;
}

function createEmptyInsights(): WrestlerInsights {
  return {
    record: "0-0",
    winPercentage: 0,
    overall: {
      pointsFor: 0,
      pointsAgainst: 0,
      escapesFor: 0,
      escapesAgainst: 0,
      nearfallPointsFor: 0,
      nearfallPointsAgainst: 0,
      decisionWins: 0,
      majorDecisionWins: 0,
      techFallWins: 0,
      fallWins: 0,
    },
    outcomePredictors: {
      firstTakedownWinPct: 0,
      leadingAfterP1WinPct: 0,
      trailingAfterP1WinPct: 0,
      tiedHeadingIntoP3WinPct: 0,
      averagePointsByPeriod: [],
    },
    takedownEfficiency: {
      ourConversionPct: 0,
      opponentConversionPct: 0,
      mostCommonTakedown: null,
      mostCommonShot: null,
      avgTakedownsInP3: { us: 0, opponent: 0 },
      shotAttemptsByPeriod: [],
    },
    topBottom: {
      zeroEscapePct: 0,
      rideOutAvg: { us: 0, opponent: 0 },
      ridingTimePointPct: { us: 0, opponent: 0 },
      reversalsAvg: { us: 0, opponent: 0 },
      nearfallAvg: { us: 0, opponent: 0 },
    },
    stall: {
      avgUs: 0,
      avgOpponent: 0,
      byPeriod: [],
    },
    clutch: {
      overtimeWinPct: 0,
      threePointMarginWinPct: 0,
    },
    recentMatches: [],
  };
}

function analyzeMatch(match: MatchWithEvents): WrestlerMatchAnalysis {
  const escapes = { us: 0, opponent: 0 };
  const nearfallPoints = { us: 0, opponent: 0 };
  const takedowns = { us: 0, opponent: 0 };
  const attempts = { us: 0, opponent: 0 };
  const reversals = { us: 0, opponent: 0 };
  const rideOuts = { us: 0, opponent: 0 };
  const stallCalls = { us: 0, opponent: 0 };
  const stallByPeriod = new Map<string, StallPeriodBreakdown>();
  const pointsByPeriod = new Map<string, PeriodPointsAverages>();
  const shotAttemptsByPeriod = new Map<string, ShotAttemptsByPeriod>();
  const takedownTypes = new Map<string, number>();
  const shotTypes = new Map<string, number>();
  const takedownsInP3 = { us: 0, opponent: 0 };

  let ridingTimePointUs = false;
  let ridingTimePointOpponent = false;
  let overtime = false;

  match.events.forEach((event) => {
    const key = getPeriodKey(event.periodType, event.periodNumber);
    const label = formatPeriodLabel(event.periodType, event.periodNumber);
    const order = getPeriodOrder(event.periodType, event.periodNumber);

    const periodEntry =
      pointsByPeriod.get(key) ?? {
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
    pointsByPeriod.set(key, periodEntry);

    switch (event.actionType) {
      case "escape":
        if (event.scorer === "us") escapes.us += 1;
        if (event.scorer === "opponent") escapes.opponent += 1;
        break;
      case "nearfall":
        if (event.scorer === "us") nearfallPoints.us += points;
        if (event.scorer === "opponent") nearfallPoints.opponent += points;
        break;
      case "takedown": {
        if (event.scorer === "us") {
          takedowns.us += 1;
          const type = event.takedownType ?? "other";
          takedownTypes.set(type, (takedownTypes.get(type) ?? 0) + 1);
          if (event.periodType === "reg" && event.periodNumber === 3) {
            takedownsInP3.us += 1;
          }
        } else if (event.scorer === "opponent") {
          takedowns.opponent += 1;
          if (event.periodType === "reg" && event.periodNumber === 3) {
            takedownsInP3.opponent += 1;
          }
        }
        break;
      }
      case "takedown_attempt":
        if (event.attacker === "us") {
          attempts.us += 1;
          const attemptType = event.takedownType ?? "other";
          shotTypes.set(attemptType, (shotTypes.get(attemptType) ?? 0) + 1);
          const periodAttempts =
            shotAttemptsByPeriod.get(key) ?? { label, order, attempts: 0 };
          periodAttempts.attempts += 1;
          shotAttemptsByPeriod.set(key, periodAttempts);
        } else if (event.attacker === "opponent") {
          attempts.opponent += 1;
        }
        break;
      case "reversal":
        if (event.scorer === "us") reversals.us += 1;
        if (event.scorer === "opponent") reversals.opponent += 1;
        break;
      case "ride_out":
        if (event.scorer === "us") rideOuts.us += 1;
        if (event.scorer === "opponent") rideOuts.opponent += 1;
        break;
      case "riding_time":
        if (event.scorer === "us") ridingTimePointUs = true;
        if (event.scorer === "opponent") ridingTimePointOpponent = true;
        break;
      case "stall_call": {
        if (event.scorer === "us") stallCalls.us += 1;
        if (event.scorer === "opponent") stallCalls.opponent += 1;
        let stallEntry = stallByPeriod.get(key);
        if (!stallEntry) {
          stallEntry = { label, order, us: 0, opponent: 0, matchesLogged: 1 };
        }
        if (event.scorer === "us") stallEntry.us += 1;
        if (event.scorer === "opponent") stallEntry.opponent += 1;
        stallByPeriod.set(key, stallEntry);
        break;
      }
      default:
        break;
    }

    if (event.periodType !== "reg") {
      overtime = true;
    }
  });

  const reg1 = pointsByPeriod.get("reg-1");
  const reg2 = pointsByPeriod.get("reg-2");
  const playedRegPeriods = new Set(
    match.events
      .filter((event) => event.periodType === "reg")
      .map((event) => event.periodNumber),
  );
  const hadReg1Data =
    playedRegPeriods.has(1) ||
    playedRegPeriods.has(2) ||
    playedRegPeriods.has(3);
  const hadReg2Data =
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
    pointsByPeriod,
    shotAttemptsByPeriod,
    takedownTypes,
    shotTypes,
    takedownsInP3,
    ridingTimePoint: { us: ridingTimePointUs, opponent: ridingTimePointOpponent },
    hadReg1Data,
    hadReg2Data,
    afterP1,
    afterP2,
    overtime,
  };
}

function buildMoveLeader(
  counts: Map<string, number>,
  matchCount: number,
): WrestlerTakedownLeader | null {
  if (!counts.size) return null;
  let leader: { type: string; total: number } | null = null;
  counts.forEach((count, type) => {
    if (!leader || count > leader.total) {
      leader = { type, total: count };
    }
  });
  if (!leader) return null;
  return {
    type: formatMoveLabel(leader.type),
    total: leader.total,
    avgPerMatch: matchCount ? leader.total / matchCount : 0,
  };
}

function buildShotAttemptsByPeriod(
  aggregate: Map<string, { label: string; order: number; attempts: number }>,
  matchCount: number,
): ShotAttemptsByPeriod[] {
  ensureShotPeriodEntries(aggregate);
  return Array.from(aggregate.values())
    .sort((a, b) => a.order - b.order)
    .map((entry) => ({
      label: entry.label,
      order: entry.order,
      attempts: matchCount ? entry.attempts / matchCount : 0,
    }));
}

function ensureShotPeriodEntries(
  aggregate: Map<string, { label: string; order: number; attempts: number }>,
) {
  const basePeriods: Array<{ key: string; label: string; order: number }> = [
    { key: "reg-1", label: "Period 1", order: 1 },
    { key: "reg-2", label: "Period 2", order: 2 },
    { key: "reg-3", label: "Period 3", order: 3 },
  ];
  basePeriods.forEach(({ key, label, order }) => {
    if (!aggregate.has(key)) {
      aggregate.set(key, { label, order, attempts: 0 });
    }
  });
}

function ensureRegPeriodAveragePoints(
  entries: PeriodPointsAverages[],
): PeriodPointsAverages[] {
  const baseLabels: Array<{ label: string; order: number }> = [
    { label: "Period 1", order: 1 },
    { label: "Period 2", order: 2 },
    { label: "Period 3", order: 3 },
  ];
  const map = new Map(entries.map((entry) => [entry.label, entry]));
  return baseLabels.map(({ label, order }) => {
    const entry = map.get(label);
    if (entry) return entry;
    return { label, order, us: 0, opponent: 0 };
  });
}

function ensureRegPeriodStall(entries: StallPeriodBreakdown[]) {
  const baseLabels: Array<{ label: string; order: number }> = [
    { label: "Period 1", order: 1 },
    { label: "Period 2", order: 2 },
    { label: "Period 3", order: 3 },
  ];
  const map = new Map(entries.map((entry) => [entry.label, entry]));
  return baseLabels.map(({ label, order }) => {
    const entry = map.get(label);
    if (entry) return entry;
    return { label, order, us: 0, opponent: 0, matchesLogged: 0 };
  });
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
    firstTakedownScorer: deriveFirstTakedownFromEvents(
      events,
      row.first_takedown_scorer,
    ),
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
  const countedPeriodMatches = new Set<string>();

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
          matchesLogged: 0,
        };
        periodMap.set(key, summary);
      }
      const matchPeriodKey = `${match.id ?? "mock"}-${key}`;
      if (!countedPeriodMatches.has(matchPeriodKey)) {
        summary.matchesLogged += 1;
        countedPeriodMatches.add(matchPeriodKey);
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
function deriveFirstTakedownFromEvents(
  events: MatchEvent[],
  fallback?: "us" | "opponent" | "none" | null,
) {
  const takedown = events
    .filter((event) => event.actionType === "takedown")
    .sort((a, b) => a.periodOrder - b.periodOrder)[0];
  if (takedown && takedown.scorer !== "none") {
    return takedown.scorer;
  }
  if (fallback && fallback !== "none") {
    return fallback;
  }
  return undefined;
}

function getEventPoints(event: MatchEvent) {
  if (typeof event.points === "number") {
    return event.points;
  }
  return ACTION_POINT_DEFAULTS[event.actionType] ?? 0;
}

function getPeriodKey(periodType: MatchEvent["periodType"], periodNumber: number) {
  return `${periodType}-${periodNumber}`;
}

function formatMoveLabel(type: string) {
  if (!type) return "Other";
  return type
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
