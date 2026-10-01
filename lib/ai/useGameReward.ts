"use client";

import { useCallback, useEffect, useState } from "react";
import {
  completeGameSession,
  syncDailyMissions,
  type CompletedGameResult,
  type GameCompletionMetadata,
} from "@/lib/progression-client";

const rewardRequests = new Map<string, Promise<CompletedGameResult>>();

function isCompletionFunctionMissing(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
  const message = error instanceof Error ? error.message : "";
  return code === "PGRST202" || code === "42883"
    || /complete_game_session.*not found|could not find the function/i.test(message);
}

type RewardState = {
  sessionId: string;
  result?: CompletedGameResult;
  error?: string;
};

export function useGameReward(
  sessionId: string,
  completed: boolean,
  metadata: GameCompletionMetadata
) {
  const metadataJson = JSON.stringify(metadata);
  const [state, setState] = useState<RewardState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setState((current) => current?.sessionId === sessionId ? null : current);
    setRetryCount((count) => count + 1);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !completed) return;

    let active = true;

    let request = rewardRequests.get(sessionId);

    if (!request) {
      const game = JSON.parse(metadataJson) as GameCompletionMetadata;

      request = completeGameSession(sessionId, game);

      rewardRequests.set(sessionId, request);
      void request.catch(() => {
        if (rewardRequests.get(sessionId) === request) {
          rewardRequests.delete(sessionId);
        }
      });
    }

    void request
      .then(async (result) => {
        // Existing XP / game history / streak / achievement
        // system has completed successfully.

        // Now update today's Daily Missions.
        try {
          await syncDailyMissions(
            metadata.game_type,
            metadata.result
          );
        } catch (missionError) {
          // Mission sync must never break the already successful
          // game reward flow.
          console.error(
            "Daily mission sync failed:",
            missionError
          );
        }

        if (active) {
          setState({
            sessionId,
            result,
          });
        }
      })
      .catch((error) => {
        console.error("Game reward sync failed:", error);
        const message = error instanceof Error ? error.message : "";

        if (active) {
          setState({
            sessionId,
            error: isCompletionFunctionMissing(error)
              ? "Game rewards are not installed yet. Run sql/schema.sql, sql/progression.sql, and sql/progression-platform.sql in Supabase, then retry this game."
              : /not authenticated/i.test(message)
              ? "Sign in to save XP for this game."
              : "XP could not be confirmed by the server. Retry to safely sync this same game.",
          });
        }
      });

    return () => {
      active = false;
    };
 }, [
  completed,
  metadataJson,
  metadata.game_type,
  metadata.result,
  retryCount,
  sessionId,
]);
  const currentState =
    state?.sessionId === sessionId ? state : null;

  return {
    result: currentState?.result ?? null,
    error: currentState?.error ?? null,
    retry,
    loading:
      completed &&
      Boolean(sessionId) &&
      currentState === null,
  };
}