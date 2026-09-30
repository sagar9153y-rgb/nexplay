"use client";

import { createClient } from "@/lib/supabase/client";

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

export async function awardGameReward(sessionId: string, xp: number): Promise<ProgressionResult> {
  if (!sessionId || !Number.isInteger(xp) || xp < 1 || xp > 500) throw new Error("Invalid game reward.");
  const { data, error } = await createClient().rpc("award_game_reward", { p_session_id: sessionId, p_xp: xp });
  if (error) throw error;
  return data as ProgressionResult;
}

function isCompletionFunctionMissing(error: { code?: string; message?: string }) {
  return error.code === "PGRST202" || error.code === "42883" || /complete_game_session.*not found|could not find the function/i.test(error.message ?? "");
}

export async function completeGameSession(sessionId: string, fallbackXp: number, game: GameCompletionMetadata): Promise<CompletedGameResult> {
  if (!sessionId || !Number.isInteger(fallbackXp) || fallbackXp < 1 || fallbackXp > 500) throw new Error("Invalid game reward.");
  const { data, error } = await createClient().rpc("complete_game_session", {
    p_session_id: sessionId,
    p_game_type: game.game_type,
    p_game_mode: game.game_mode,
    p_ai_difficulty: game.ai_difficulty,
    p_result: game.result,
    p_score: game.score,
    p_moves: game.moves,
    p_accuracy: game.accuracy,
    p_reaction_times: game.reaction_times,
  });
  if (error) {
    if (isCompletionFunctionMissing(error)) return await awardGameReward(sessionId, fallbackXp);
    throw error;
  }
  return data as CompletedGameResult;
}

export async function syncDailyMissions(
  gameType: string,
  result: "win" | "loss" | "draw" | "complete"
) {
  const { createClient } = await import("@/lib/supabase/client");

  const supabase = createClient();

  const { data, error } = await supabase.rpc("sync_daily_missions", {
    p_game_type: gameType,
    p_result: result,
  });

  if (error) {
    console.error("Daily mission sync failed:", error);
    return null;
  }

  return data;
}