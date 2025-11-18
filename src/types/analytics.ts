import type { MatchWithEvents } from "./match";
import type { Wrestler } from "./wrestler";

export interface WrestlerPeriodBreakdown {
  periodLabel: string;
  periodOrder: number;
  takedownsFor: number;
  takedownsAgainst: number;
  attemptsFor: number;
  attemptsAgainst: number;
  pointsDifferential: number;
  matchesLogged: number;
}

export interface PeriodPointsAverages {
  label: string;
  order: number;
  us: number;
  opponent: number;
}

export interface StallPeriodBreakdown {
  label: string;
  order: number;
  us: number;
  opponent: number;
  matchesLogged: number;
}

export interface ShotAttemptsByPeriod {
  label: string;
  order: number;
  attempts: number;
}

export interface WrestlerTakedownLeader {
  type: string;
  total: number;
  avgPerMatch: number;
}

export interface WrestlerSeasonStats {
  wrestler: Wrestler;
  record: string;
  winPercentage: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  firstTakedownWinPct: number;
  ridingTimeAdvantagePct: number;
  matches: MatchWithEvents[];
  periods: WrestlerPeriodBreakdown[];
  overall: {
    pointsFor: number;
    pointsAgainst: number;
    escapesFor: number;
    escapesAgainst: number;
    nearfallPointsFor: number;
    nearfallPointsAgainst: number;
    decisionWins: number;
    majorDecisionWins: number;
    techFallWins: number;
    fallWins: number;
  };
  outcomePredictors: {
    firstTakedownWinPct: number;
    leadingAfterP1WinPct: number;
    trailingAfterP1WinPct: number;
    tiedHeadingIntoP3WinPct: number;
    averagePointsByPeriod: PeriodPointsAverages[];
  };
  takedownEfficiency: {
    ourConversionPct: number;
    opponentConversionPct: number;
    ourTakedowns: number;
    ourAttempts: number;
    mostCommonTakedown?: WrestlerTakedownLeader | null;
    mostCommonShot?: WrestlerTakedownLeader | null;
    avgTakedownsInP3: { us: number; opponent: number };
    shotAttemptsByPeriod: ShotAttemptsByPeriod[];
  };
  topBottom: {
    zeroEscapePct: number;
    rideOutAvg: { us: number; opponent: number };
    ridingTimePointPct: { us: number; opponent: number };
    reversalsAvg: { us: number; opponent: number };
    nearfallAvg: { us: number; opponent: number };
  };
  stall: {
    avgUs: number;
    avgOpponent: number;
    byPeriod: StallPeriodBreakdown[];
  };
  clutch: {
    overtimeWinPct: number;
    threePointMarginWinPct: number;
  };
  recentMatches: MatchWithEvents[];
}

export interface LeaderboardEntry {
  id: string | number;
  label: string;
  value: string;
  helper?: string;
}

export type TeamPeriodStat = WrestlerPeriodBreakdown;

export interface PeriodPointsAverages {
  label: string;
  order: number;
  us: number;
  opponent: number;
}

export interface StallPeriodBreakdown {
  label: string;
  order: number;
  us: number;
  opponent: number;
  matchesLogged: number;
}

export interface TeamDashboardData {
  seasonLabel: string;
  matchesLogged: number;
  overall: {
    record: string;
    dualRecord: string;
    totalWins: number;
    totalTakedowns: number;
    pointsFor: number;
    pointsAgainst: number;
    escapesFor: number;
    escapesAgainst: number;
    nearfallPointsFor: number;
    nearfallPointsAgainst: number;
    decisionWins: number;
    majorDecisionWins: number;
    techFallWins: number;
    fallWins: number;
  };
  outcomePredictors: {
    firstTakedownWinPct: number;
    leadingAfterP1WinPct: number;
    trailingAfterP1WinPct: number;
    tiedHeadingIntoP3WinPct: number;
    averagePointsByPeriod: PeriodPointsAverages[];
  };
  takedownEfficiency: {
    ourConversionPct: number;
    opponentConversionPct: number;
    ourTakedowns: number;
    opponentTakedowns: number;
    ourAttempts: number;
    opponentAttempts: number;
    avgTakedownsInP3: { us: number; opponent: number };
    avgTakedownsByPeriod: TeamPeriodStat[];
    shotAttemptsByPeriod: ShotAttemptsByPeriod[];
  };
  topBottom: {
    zeroEscapePct: number;
    rideOutAvg: { us: number; opponent: number };
    ridingTimePointPct: { us: number; opponent: number };
    reversalsAvg: { us: number; opponent: number };
  };
  stall: {
    avgUs: number;
    avgOpponent: number;
    byPeriod: StallPeriodBreakdown[];
  };
  clutch: {
    overtimeWinPct: number;
    onePointWinPct: number;
    twoPointWinPct: number;
  };
  leaderboards: {
    wins: LeaderboardEntry[];
    takedowns: LeaderboardEntry[];
  };
  recentMatches: MatchWithEvents[];
}
