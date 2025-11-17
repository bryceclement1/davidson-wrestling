export type ActionType =
  | "takedown"
  | "takedown_attempt"
  | "escape"
  | "reversal"
  | "nearfall"
  | "riding_time"
  | "stall_call"
  | "caution"
  | "ride_out";

export type PeriodType = "reg" | "ot" | "tb";

export type MatchSide = "us" | "opponent" | "none";

export type TakedownType =
  | "single"
  | "double"
  | "sweep_single"
  | "low_single"
  | "high_c"
  | "throw"
  | "trip"
  | "ankle_pick"
  | "front_head"
  | "slide_by"
  | "sprawl_go_behind"
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
  points?: 0 | 1 | 2 | 3 | 4;
  createdAt?: string;
}
