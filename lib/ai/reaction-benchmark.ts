import type { AIDifficulty } from "@/lib/ai/types";

export type ReactionBenchmarkRange = { minimumMs: number; maximumMs: number };

const benchmarkRanges: Record<AIDifficulty, ReactionBenchmarkRange> = {
  easy: { minimumMs: 340, maximumMs: 520 },
  medium: { minimumMs: 300, maximumMs: 480 },
  hard: { minimumMs: 260, maximumMs: 440 },
};

export function getReactionBenchmarkRange(difficulty: AIDifficulty): ReactionBenchmarkRange {
  return benchmarkRanges[difficulty];
}

export function createReactionBenchmarkTime(
  difficulty: AIDifficulty,
  random: () => number = Math.random,
): number {
  const { minimumMs, maximumMs } = getReactionBenchmarkRange(difficulty);
  return Math.round(minimumMs + random() * (maximumMs - minimumMs));
}

export function calculateAverage(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function calculateConsistency(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length));
}
