import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockWrestlerStats } from "./mockData";
import type { WrestlerSeasonStats } from "@/types/analytics";

export async function getWrestlerSeasonStats(
  wrestlerId: number,
): Promise<WrestlerSeasonStats | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockWrestlerStats[wrestlerId] ?? null;
  }

  const { data, error } = await supabase.rpc("get_wrestler_dashboard", {
    wrestler_id: wrestlerId,
  });

  if (error || !data) {
    console.error("Wrestler dashboard RPC failed", error);
    return mockWrestlerStats[wrestlerId] ?? null;
  }

  return data as WrestlerSeasonStats;
}
