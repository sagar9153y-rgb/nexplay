"use client";

import { useEffect, useState } from "react";
import {
  completeGameSession,
  syncDailyMissions,
  type CompletedGameResult,
  type GameCompletionMetadata,
} from "@/lib/progression-client";

const rewardRequests = new Map<string, Promise<CompletedGameResult>>();

type RewardState = {
  sessionId: string;
  result?: CompletedGameResult;
  error?: string;
};

export function useGameReward(
  sessionId: string,
  completed: boolean,
  fallbackXp: number,
  metadata: GameCompletionMetadata
) {
  const metadataJson = JSON.stringify(metadata);
  const [state, setState] = useState<RewardState | null>(null);

  useEffect(() => {
    if (!sessionId || !completed) return;

    let active = true;

    let request = rewardRequests.get(sessionId);

    if (!request) {
      const game = JSON.parse(metadataJson) as GameCompletionMetadata;

      request = completeGameSession(sessionId, fallbackXp, game);

      rewardRequests.set(sessionId, request);
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

        if (active) {
          setState({
            sessionId,
            error: "XP could not be synced. Your game result is safe.",
          });
        }
      });

    return () => {
      active = false;
    };
 }, [
  completed,
  fallbackXp,
  metadataJson,
  metadata.game_type,
  metadata.result,
  sessionId,
]);
  const currentState =
    state?.sessionId === sessionId ? state : null;

  return {
    result: currentState?.result ?? null,
    error: currentState?.error ?? null,
    loading:
      completed &&
      Boolean(sessionId) &&
      currentState === null,
  };
}