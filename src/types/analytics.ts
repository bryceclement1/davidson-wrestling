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
}

export interface TeamDashboardData {
  seasonLabel: string;
  matchesLogged: number;
  overall: {
    record: string;
    pointsFor: number;
    pointsAgainst: number;
    escapesFor: number;
    escapesAgainst: number;
    nearfallPointsFor: number;
    nearfallPointsAgainst: number;
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
    ourAttempts: number;
    opponentAttempts: number;
  };
  topBottom: {
    zeroEscapePct: number;
    rideOuts: { us: number; opponent: number };
    ridingTimePointPct: { us: number; opponent: number };
    reversals: { us: number; opponent: number };
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
