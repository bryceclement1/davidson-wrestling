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

export interface TeamDashboardData {
  seasonLabel: string;
  record: string;
  matchesLogged: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  firstTakedownWinPct: number;
  ridingTimeAdvantagePct: number;
  periodStats: TeamPeriodStat[];
  leaderboards: {
    wins: LeaderboardEntry[];
    takedowns: LeaderboardEntry[];
    thirdPeriod: LeaderboardEntry[];
    firstTakedown: LeaderboardEntry[];
  };
  recentMatches: MatchWithEvents[];
}
