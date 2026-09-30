import type { SupabaseClient } from "@supabase/supabase-js";

const PROGRESSION_QUERY_TIMEOUT_MS = 8000;

export async function withProgressionTimeout<T>(request: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Progression query timed out.")), PROGRESSION_QUERY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export type ProgressionProfile = {
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  games_played: number;
  created_at: string;
};

export type ProgressionStats = {
  games_played: number;
  history_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  global_rank: number | null;
};

export type ProgressionStreak = {
  current: number;
  best: number;
  last_active_date: string | null;
};

export type AchievementProgress = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
};

export type GameHistoryEntry = {
  id: number;
  game_type: "tic-tac-toe" | "memory-match" | "reaction-rush" | "quick-quiz";
  game_mode: string;
  ai_difficulty: "easy" | "medium" | "hard" | null;
  result: "win" | "loss" | "draw" | "complete";
  score: number | null;
  moves: number | null;
  accuracy: number | null;
  average_reaction_ms: number | null;
  best_reaction_ms: number | null;
  xp_awarded: number;
  played_at: string;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  is_current_user: boolean;
};

export type ProgressionSnapshot = {
    migrationPending?: boolean;
  profile: ProgressionProfile;
  stats: ProgressionStats;
  streak: ProgressionStreak;
  recent_games: GameHistoryEntry[];
  achievements: AchievementProgress[];
  recent_achievements: AchievementProgress[];
  leaderboard_preview: LeaderboardEntry[];
};

export async function getProgressionSnapshot(client: SupabaseClient): Promise<ProgressionSnapshot> {
  const { data, error } = await withProgressionTimeout(client.rpc("get_player_progression"));
  if (error?.code === "PGRST202" || error?.code === "42883") {
    const { data: profile, error: profileError } = await withProgressionTimeout(client.from("profiles").select("username, avatar_url, xp, level, games_played, created_at").maybeSingle());
    if (!profileError && profile) {
      const currentProfile = profile as ProgressionProfile;
      return {
        migrationPending: true,
        profile: currentProfile,
        stats: { games_played: currentProfile.games_played, history_games: 0, wins: 0, losses: 0, draws: 0, win_rate: 0, global_rank: null },
        streak: { current: 0, best: 0, last_active_date: null },
        recent_games: [],
        achievements: [],
        recent_achievements: [],
        leaderboard_preview: [],
      };
    }
  }
  if (error || !data || typeof data !== "object" || "error" in data) {
    throw new Error("Player progression is temporarily unavailable.");
  }
  return data as ProgressionSnapshot;
}

export async function getGlobalLeaderboard(client: SupabaseClient, limit = 100): Promise<LeaderboardEntry[]> {
  const { data, error } = await withProgressionTimeout(client.rpc("get_global_leaderboard", { p_limit: limit }));
  if (error || !data) throw new Error("The leaderboard is temporarily unavailable.");
  return data as LeaderboardEntry[];
}
