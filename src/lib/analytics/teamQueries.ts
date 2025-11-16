import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeaderboardEntry, TeamDashboardData } from "@/types/analytics";
import type { MatchWithEvents } from "@/types/match";
import { mockTeamDashboard } from "./mockData";

type PeriodRow = {
  season_id: number | null;
  period_type: string;
  period_number: number;
  period_order: number;
  takedowns_for: number;
  takedowns_against: number;
  attempts_for: number;
  attempts_against: number;
  points_for: number;
  points_against: number;
};

type SeasonRow = {
  wrestler_id: number;
  wrestler_name: string;
  season_id: number | null;
  wins: number;
  losses: number;
  matches_wrestled: number;
  total_takedowns_for: number;
  first_takedown_win_pct: number | null;
  riding_time_advantage_pct: number | null;
};

type PeriodSummaryRow = {
  wrestler_id: number;
  wrestler_name: string;
  season_id: number | null;
  period_type: string;
  period_number: number;
  points_for: number;
  points_against: number;
};

type MatchRow = {
  id: number;
  date: string;
  wrestler_id: number;
  opponent_name: string;
  result: "W" | "L" | "D" | "FF";
  our_score: number;
  opponent_score: number;
  first_takedown_scorer: "us" | "opponent" | "none" | null;
  our_riding_time_seconds: number | null;
  opponent_riding_time_seconds: number | null;
  match_type: "dual" | "tournament";
  wrestlers?: {
    name?: string | null;
  } | null;
};

function formatPeriodLabel(row: PeriodRow) {
  if (row.period_type === "reg") {
    return `Period ${row.period_number}`;
  }
  if (row.period_type === "ot") {
    return `OT ${row.period_number}`;
  }
  return `TB ${row.period_number}`;
}

function createLeaderboard(
  rows: SeasonRow[],
  accessor: (row: SeasonRow) => number,
  formatter: (row: SeasonRow) => LeaderboardEntry,
) {
  return rows
    .slice()
    .sort((a, b) => accessor(b) - accessor(a))
    .slice(0, 4)
    .map(formatter);
}

export async function getTeamDashboardData(): Promise<TeamDashboardData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockTeamDashboard;
  }

  try {
    const { data: season } = await supabase
      .from("seasons")
      .select("*")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const seasonId = season?.id ?? null;

    let matchesQuery = supabase
      .from("matches")
      .select(
        "id, date, wrestler_id, opponent_name, result, match_type, our_score, opponent_score, first_takedown_scorer, our_riding_time_seconds, opponent_riding_time_seconds, wrestlers(name)",
      )
      .order("date", { ascending: false })
      .limit(20);

    if (seasonId) {
      matchesQuery = matchesQuery.eq("season_id", seasonId);
    }

    const { data: matchesData, error: matchesError } = await matchesQuery;
    if (matchesError) {
      throw matchesError;
    }

    let periodQuery = supabase
      .from("v_team_period_stats")
      .select("*")
      .order("period_order", { ascending: true });

    if (seasonId) {
      periodQuery = periodQuery.eq("season_id", seasonId);
    }

    const { data: periodRows, error: periodError } = await periodQuery;

    if (periodError) {
      throw periodError;
    }

    let seasonStatsQuery = supabase
      .from("v_wrestler_season_stats")
      .select("*");

    if (seasonId) {
      seasonStatsQuery = seasonStatsQuery.eq("season_id", seasonId);
    }

    const { data: seasonRows, error: seasonError } = await seasonStatsQuery;

    if (seasonError) {
      throw seasonError;
    }

    let thirdPeriodQuery = supabase
      .from("v_wrestler_period_summary")
      .select("wrestler_id,wrestler_name,season_id,period_type,period_number,points_for,points_against")
      .eq("period_type", "reg")
      .eq("period_number", 3);

    if (seasonId) {
      thirdPeriodQuery = thirdPeriodQuery.eq("season_id", seasonId);
    }

    const { data: thirdPeriodRows, error: thirdPeriodError } =
      await thirdPeriodQuery;

    if (thirdPeriodError) {
      throw thirdPeriodError;
    }

    const matches = (matchesData ?? []) as MatchRow[];
    const matchCount = matches.length;
    const wins = matches.filter((match) => match.result === "W").length;
    const losses = matches.filter((match) => match.result === "L").length;
    const totalPointsFor = matches.reduce(
      (sum, match) => sum + (match.our_score ?? 0),
      0,
    );
    const totalPointsAgainst = matches.reduce(
      (sum, match) => sum + (match.opponent_score ?? 0),
      0,
    );
    const firstTakedownTotal = matches.filter(
      (match) => match.first_takedown_scorer === "us",
    ).length;
    const firstTakedownWins = matches.filter(
      (match) =>
        match.first_takedown_scorer === "us" && match.result === "W",
    ).length;
    const ridingTimeAdvantage = matches.filter(
      (match) =>
        (match.our_riding_time_seconds ?? 0) >
        (match.opponent_riding_time_seconds ?? 0),
    ).length;

    const periodStats = ((periodRows ?? []) as PeriodRow[]).map((row) => ({
      periodLabel: formatPeriodLabel(row),
      periodOrder: row.period_order,
      takedownsFor: row.takedowns_for ?? 0,
      takedownsAgainst: row.takedowns_against ?? 0,
      attemptsFor: row.attempts_for ?? 0,
      attemptsAgainst: row.attempts_against ?? 0,
      pointsDifferential: (row.points_for ?? 0) - (row.points_against ?? 0),
    }));

    const seasonStats = (seasonRows ?? []) as SeasonRow[];

    const winsLeaderboard = createLeaderboard(
      seasonStats,
      (row) => row.wins,
      (row) => ({
        id: row.wrestler_id,
        label: row.wrestler_name,
        value: `${row.wins}-${row.losses}`,
        helper: `${row.matches_wrestled} matches`,
      }),
    );

    const takedownLeaderboard = createLeaderboard(
      seasonStats,
      (row) => row.total_takedowns_for ?? 0,
      (row) => ({
        id: row.wrestler_id,
        label: row.wrestler_name,
        value: String(row.total_takedowns_for ?? 0),
        helper: `${row.matches_wrestled} matches`,
      }),
    );

    const firstTakedownLeaderboard = createLeaderboard(
      seasonStats,
      (row) => row.first_takedown_win_pct ?? 0,
      (row) => ({
        id: row.wrestler_id,
        label: row.wrestler_name,
        value: `${Math.round((row.first_takedown_win_pct ?? 0) * 100)}%`,
        helper: "First takedown win %",
      }),
    );

    const thirdPeriodMap = new Map<
      number,
      { name: string; diff: number }
    >();
    ((thirdPeriodRows ?? []) as PeriodSummaryRow[]).forEach((row) => {
      const current = thirdPeriodMap.get(row.wrestler_id) ?? {
        name: row.wrestler_name,
        diff: 0,
      };
      current.diff += (row.points_for ?? 0) - (row.points_against ?? 0);
      thirdPeriodMap.set(row.wrestler_id, current);
    });

    const thirdPeriodLeaderboard = Array.from(thirdPeriodMap.entries())
      .sort(([, a], [, b]) => b.diff - a.diff)
      .slice(0, 4)
      .map(([id, entry]) => ({
        id,
        label: entry.name,
        value: `${entry.diff > 0 ? "+" : ""}${entry.diff}`,
        helper: "3rd period diff",
      }));

    const recentMatches: MatchWithEvents[] = matches.slice(0, 8).map((match) => ({
      id: match.id,
      wrestlerId: match.wrestler_id,
      wrestlerName: match.wrestlers?.name ?? undefined,
      opponentName: match.opponent_name,
      matchType: match.match_type ?? "dual",
      date: match.date,
      result: match.result,
      ourScore: match.our_score,
      opponentScore: match.opponent_score,
      firstTakedownScorer: match.first_takedown_scorer,
      events: [],
    }));

    return {
      seasonLabel: season?.name ?? "Current Season",
      record: `${wins}-${losses}`,
      matchesLogged: matchCount,
      totalPointsFor,
      totalPointsAgainst,
      firstTakedownWinPct:
        firstTakedownTotal > 0
          ? firstTakedownWins / firstTakedownTotal
          : 0,
      ridingTimeAdvantagePct:
        matchCount > 0 ? ridingTimeAdvantage / matchCount : 0,
      periodStats,
      leaderboards: {
        wins: winsLeaderboard,
        takedowns: takedownLeaderboard,
        thirdPeriod: thirdPeriodLeaderboard,
        firstTakedown: firstTakedownLeaderboard,
      },
      recentMatches,
    };
  } catch (error) {
    console.error("Team dashboard query failed", error);
    return mockTeamDashboard;
  }
}
