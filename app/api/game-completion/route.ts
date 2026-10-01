import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GameCompletionMetadata } from "@/lib/progression-client";

const gameTypes = ["tic-tac-toe", "memory-match", "reaction-rush", "quick-quiz"];
const results = ["win", "loss", "draw", "complete"];
const difficulties = ["easy", "medium", "hard"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number" && Number.isFinite(value);
}

function isGameCompletionMetadata(value: unknown): value is GameCompletionMetadata {
  if (!isRecord(value)) return false;
  return gameTypes.includes(value.game_type as string)
    && typeof value.game_mode === "string"
    && (value.ai_difficulty === null || difficulties.includes(value.ai_difficulty as string))
    && results.includes(value.result as string)
    && isNullableNumber(value.score)
    && isNullableNumber(value.moves)
    && isNullableNumber(value.accuracy)
    && (value.reaction_times === null
      || Array.isArray(value.reaction_times)
        && value.reaction_times.every((time) => Number.isInteger(time)));
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isRecord(payload)
    || typeof payload.sessionId !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sessionId)
    || !isGameCompletionMetadata(payload.game)) {
    return NextResponse.json({ error: "Invalid game completion data." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const game = payload.game;
  const { data, error } = await supabase.rpc("complete_game_session", {
    p_session_id: payload.sessionId,
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
    console.error("Game completion RPC failed:", error.message);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.code === "PGRST202" || error.code === "42883" ? 503 : 400 }
    );
  }

  return NextResponse.json(data);
}
