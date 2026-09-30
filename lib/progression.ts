export function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function getXpForNextLevel(level: number) {
  return Math.pow(Math.max(1, level), 2) * 100;
}

export function getLevelProgress(xp: number) {
  const safeXp = Math.max(0, xp);
  const level = calculateLevel(safeXp);
  const currentLevelXp = getXpForNextLevel(level - 1);
  const nextLevelXp = getXpForNextLevel(level);
  return { level, currentLevelXp, nextLevelXp, xpIntoLevel: safeXp - currentLevelXp, xpToNextLevel: Math.max(0, nextLevelXp - safeXp), percent: Math.min(100, Math.max(0, ((safeXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)) };
}

export type RewardKind = "tic-tac-toe" | "memory-match" | "reaction-rush" | "quick-quiz";
export type RewardInput = { game: RewardKind; outcome?: "win" | "draw" | "loss" | "complete"; score?: number; moves?: number; reactionTime?: number; reactionTimes?: number[]; correctAnswers?: number };

export function calculateGameReward(input: RewardInput) {
  if (input.game === "tic-tac-toe") return input.outcome === "win" ? 50 : input.outcome === "draw" ? 20 : 10;
  if (input.game === "memory-match") return 100 + (input.moves !== undefined && input.moves < 20 ? 100 : input.moves !== undefined && input.moves < 30 ? 50 : 25);
  if (input.game === "reaction-rush") { const times = input.reactionTimes ?? (input.reactionTime === undefined ? [] : [input.reactionTime]); const total = times.reduce((sum, time) => sum + (time < 200 ? 200 : time < 300 ? 150 : time < 400 ? 125 : time < 500 ? 100 : 75), 0); return Math.min(500, total); }
  const correct = input.correctAnswers ?? 0;
  return 50 + (correct >= 8 ? 200 : correct >= 5 ? 150 : correct >= 1 ? 100 : 50);
}