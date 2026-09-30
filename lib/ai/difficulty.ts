import type { AIDifficulty } from "@/lib/ai/types";

const quizAccuracy: Record<AIDifficulty, number> = {
  easy: 0.6,
  medium: 0.75,
  hard: 0.9,
};

const quizResponseDelay: Record<AIDifficulty, readonly [number, number]> = {
  easy: [2600, 4400],
  medium: [2100, 3700],
  hard: [1700, 3200],
};

function randomIndex(length: number, random: () => number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
}

export function chooseQuizAnswer(
  correctIndex: number,
  optionCount: number,
  difficulty: AIDifficulty,
  random: () => number = Math.random,
): { optionIndex: number } {
  const isCorrect = random() < quizAccuracy[difficulty];
  if (isCorrect || optionCount < 2) return { optionIndex: correctIndex };

  const incorrectOptions = Array.from({ length: optionCount }, (_, index) => index)
    .filter((index) => index !== correctIndex);
  return { optionIndex: incorrectOptions[randomIndex(incorrectOptions.length, random)] ?? correctIndex };
}

export function getQuizResponseDelay(difficulty: AIDifficulty, random: () => number = Math.random): number {
  const [minimum, maximum] = quizResponseDelay[difficulty];
  return Math.round(minimum + random() * (maximum - minimum));
}
