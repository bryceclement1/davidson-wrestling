import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeamEvent, EventType } from "@/types/event";

export interface CreateEventPayload {
  name: string;
  date: string;
  eventType: EventType;
  opponentSchool?: string;
}

export interface UpdateEventPayload {
  name?: string;
  date?: string;
  eventType?: EventType;
  opponentSchool?: string | null;
}

function mapRowToEvent(row: {
  id: number;
  name: string;
  event_type: EventType;
  date: string;
  opponent_school: string | null;
}): TeamEvent {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    type: row.event_type,
    opponentSchool: row.opponent_school,
  };
}

export async function listEvents(): Promise<TeamEvent[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  if (error || !data) {
    console.error("Failed to load events", error);
    return [];
  }

  return data.map(mapRowToEvent);
}

export async function createEvent(payload: CreateEventPayload) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase unavailable");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: payload.name,
      date: payload.date,
      event_type: payload.eventType,
      opponent_school: payload.eventType === "dual" ? payload.opponentSchool ?? null : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create event", error);
    throw new Error("Unable to create event");
  }

  return mapRowToEvent(data);
}

export async function updateEvent(id: number, payload: UpdateEventPayload) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase unavailable");
  }

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.date !== undefined) updates.date = payload.date;
  if (payload.eventType !== undefined) updates.event_type = payload.eventType;
  if (payload.opponentSchool !== undefined) {
    updates.opponent_school =
      payload.eventType === "dual"
        ? payload.opponentSchool ?? null
        : payload.opponentSchool;
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update event", error);
    throw new Error("Unable to update event");
  }

  return mapRowToEvent(data);
}

export async function deleteEvent(id: number) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase unavailable");
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete event", error);
    throw new Error("Unable to delete event");
  }
}
