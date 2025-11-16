import type { Wrestler } from "@/types/wrestler";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockWrestlers } from "@/lib/analytics/mockData";

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

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    classYear: row.class_year ?? undefined,
    primaryWeightClass: row.primary_weight_class ?? undefined,
    active: row.active,
    userId: row.user_id,
  }));
}

export async function getWrestlerById(id: number) {
  const roster = await getRoster();
  return roster.find((w) => w.id === id) ?? null;
}
