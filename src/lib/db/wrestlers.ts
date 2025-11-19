import type { Wrestler } from "@/types/wrestler";
import type { Database } from "@/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockWrestlers } from "@/lib/analytics/mockData";

type WrestlerRow = Database["public"]["Tables"]["wrestlers"]["Row"];

function mapRowToWrestler(row: WrestlerRow): Wrestler {
  return {
    id: row.id,
    name: row.name,
    classYear: row.class_year ?? undefined,
    primaryWeightClass: row.primary_weight_class ?? undefined,
    active: row.active ?? true,
    userId: row.user_id,
  };
}

export interface CreateWrestlerPayload {
  name: string;
  classYear?: string;
  primaryWeightClass?: string;
  active?: boolean;
}

export interface UpdateWrestlerPayload {
  name?: string;
  classYear?: string | null;
  primaryWeightClass?: string | null;
  active?: boolean;
}

export async function getRoster(): Promise<Wrestler[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockWrestlers;
  }

  const { data, error } = await supabase
    .from("wrestlers")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("Roster query failed", error);
    return mockWrestlers;
  }

  return data.map(mapRowToWrestler);
}

export async function getWrestlerById(id: number) {
  const roster = await getRoster();
  return roster.find((w) => w.id === id) ?? null;
}

export async function createWrestler(payload: CreateWrestlerPayload) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await supabase
    .from("wrestlers")
    .insert({
      name: payload.name,
      class_year: payload.classYear ?? null,
      primary_weight_class: payload.primaryWeightClass ?? null,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Unable to create wrestler", error);
    throw new Error("Failed to create wrestler");
  }

  return mapRowToWrestler(data);
}

export async function updateWrestler(id: number, payload: UpdateWrestlerPayload) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.classYear !== undefined) updates.class_year = payload.classYear;
  if (payload.primaryWeightClass !== undefined) {
    updates.primary_weight_class = payload.primaryWeightClass;
  }
  if (payload.active !== undefined) updates.active = payload.active;

  const { data, error } = await supabase
    .from("wrestlers")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Unable to update wrestler", error);
    throw new Error("Failed to update wrestler");
  }

  return mapRowToWrestler(data);
}

export async function deleteWrestler(id: number) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { error } = await supabase.from("wrestlers").delete().eq("id", id);

  if (error) {
    console.error("Unable to delete wrestler", error);
    throw new Error("Failed to delete wrestler");
  }
}
