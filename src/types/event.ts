export type EventType = "dual" | "tournament";

export interface TeamEvent {
  id: number;
  name: string;
  date: string; // ISO date string
  type: EventType;
  opponentSchool?: string | null;
}
