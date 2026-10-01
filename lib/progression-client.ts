"use client";

export type ProgressionResult = { xp_awarded: number; total_xp: number; level: number; games_played: number; level_up: boolean; already_awarded: boolean };

export type GameCompletionMetadata = {
  game_type: "tic-tac-toe" | "memory-match" | "reaction-rush" | "quick-quiz";
  game_mode: string;
  ai_difficulty: "easy" | "medium" | "hard" | null;
  result: "win" | "loss" | "draw" | "complete";
  score: number | null;
  moves: number | null;
  accuracy: number | null;
  reaction_times: number[] | null;
};

export type AchievementUnlock = { id: string; name: string; description: string; icon: string };
export type CompletedGameResult = ProgressionResult & {
  history_id?: number;
  current_streak?: number;
  best_streak?: number;
  new_achievements?: AchievementUnlock[];
};

export async function completeGameSession(sessionId: string, game: GameCompletionMetadata): Promise<CompletedGameResult> {
  if (!sessionId) throw new Error("Invalid game session.");
  const response = await fetch("/api/game-completion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, game }),
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const errorPayload = typeof payload === "object" && payload !== null
      ? payload as { error?: unknown; code?: unknown }
      : {};
    const message = typeof errorPayload.error === "string"
      ? errorPayload.error
      : "Unable to sync game rewards.";
    const code = typeof errorPayload.code === "string" ? errorPayload.code : undefined;
    const error = new Error(message) as Error & { code?: string };
    error.code = code;
    throw error;
  }
  return payload as CompletedGameResult;
}

export async function syncDailyMissions() {
  const { createClient } = await import("@/lib/supabase/client");

  const supabase = createClient();

  const { data, error } = await supabase.rpc("sync_daily_missions");

  if (error) {
    console.error("Daily mission sync failed:", error);
    return null;
  }

  return data;
}