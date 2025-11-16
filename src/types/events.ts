export type ActionType =
  | "takedown"
  | "takedown_attempt"
  | "escape"
  | "reversal"
  | "nearfall";

export type PeriodType = "reg" | "ot" | "tb";

export type MatchSide = "us" | "opponent" | "none";

export type TakedownType =
  | "single"
  | "double"
  | "high_c"
  | "ankle_pick"
  | "throw"
  | "trip"
  | "other";

export interface MatchEvent {
  id: string;
  matchId?: number;
  actionType: ActionType;
  periodOrder: number;
  periodType: PeriodType;
  periodNumber: number;
  scorer: MatchSide;
  attacker?: Exclude<MatchSide, "none">;
  takedownType?: TakedownType;
  points?: 2 | 3 | 4;
  createdAt?: string;
}
