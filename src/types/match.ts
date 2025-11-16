import type { MatchEvent } from "./events";

export type MatchResult = "W" | "L" | "D" | "FF";
export type MatchType = "dual" | "tournament";
export type MatchOutcomeType =
  | "decision"
  | "major_decision"
  | "tech_fall"
  | "fall"
  | "forfeit"
  | "injury";

export interface MatchMeta {
  id?: number;
  wrestlerId: number;
  opponentName: string;
  opponentSchool?: string;
  weightClass?: string;
  seasonId?: number;
  eventId?: number | null;
  matchType: MatchType;
  eventName?: string;
  outcomeType?: MatchOutcomeType;
  date: string;
  result: MatchResult;
  ourScore: number;
  opponentScore: number;
  firstTakedownScorer?: "us" | "opponent" | "none";
  ourRidingTimeSeconds?: number;
  opponentRidingTimeSeconds?: number;
}

export interface MatchWithEvents extends MatchMeta {
  wrestlerName?: string;
  events: MatchEvent[];
}

export interface MatchLogPayload {
  match: MatchMeta;
  events: MatchEvent[];
}
