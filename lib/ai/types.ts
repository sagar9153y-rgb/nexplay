export const AI_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type AIDifficulty = (typeof AI_DIFFICULTIES)[number];
export type QuizAnswer = { optionIndex: number; responseTimeMs: number };
