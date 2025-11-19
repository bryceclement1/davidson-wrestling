import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeamPeriodStat, WrestlerPeriodBreakdown } from "@/types/analytics";
import type { Database } from "@/types/database";
import { mockTeamPeriodStats, mockWrestlerStats } from "./mockData";

export async function getTeamPeriodBreakdown(): Promise<TeamPeriodStat[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockTeamPeriodStats;
  }

  const { data, error } = await supabase.rpc("get_team_period_stats");

  if (error || !data) {
    console.error("Team period stats RPC failed", error);
    return mockTeamPeriodStats;
  }

  return data.map(
    (
      row: Database["public"]["Functions"]["get_team_period_stats"]["Returns"][number],
    ) => ({
      periodLabel: row.period_label,
      periodOrder: row.period_order,
      takedownsFor: row.takedowns_for,
      takedownsAgainst: row.takedowns_against,
      attemptsFor: row.attempts_for,
      attemptsAgainst: row.attempts_against,
      pointsDifferential: row.points_differential,
      matchesLogged: row.matches_logged,
    }),
  );
}

export async function getWrestlerPeriodBreakdown(
  wrestlerId: number,
): Promise<WrestlerPeriodBreakdown[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockWrestlerStats[wrestlerId]?.periods ?? [];
  }

  const { data, error } = await supabase.rpc("get_wrestler_period_stats", {
    target_wrestler_id: wrestlerId,
  });

  if (error || !data) {
    console.error("Wrestler period stats RPC failed", error);
    return mockWrestlerStats[wrestlerId]?.periods ?? [];
  }

  return data.map(
    (
      row: Database["public"]["Functions"]["get_wrestler_period_stats"]["Returns"][number],
    ) => ({
      periodLabel: row.period_label,
      periodOrder: row.period_order,
      takedownsFor: row.takedowns_for,
      takedownsAgainst: row.takedowns_against,
      attemptsFor: row.attempts_for,
      attemptsAgainst: row.attempts_against,
      pointsDifferential: row.points_differential,
      matchesLogged: row.matches_logged,
    }),
  );
}
