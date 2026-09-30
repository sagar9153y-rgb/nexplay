import type { AIDifficulty } from "@/lib/ai/types";

export type RevealedMemoryCard = { id: number; value: string };
export type MemoryAIMove = readonly [firstId: number, secondId: number];

const recallRate: Record<AIDifficulty, number> = {
  easy: 0.35,
  medium: 0.72,
  hard: 0.98,
};

const thinkingDelay: Record<AIDifficulty, readonly [number, number]> = {
  easy: [1100, 1500],
  medium: [750, 1050],
  hard: [500, 750],
};

function randomIndex(length: number, random: () => number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
}

export function getMemoryAIDelay(difficulty: AIDifficulty, random: () => number = Math.random): number {
  const [minimum, maximum] = thinkingDelay[difficulty];
  return Math.round(minimum + random() * (maximum - minimum));
}

export function chooseMemoryAIMove(
  revealedMemory: readonly RevealedMemoryCard[],
  availableCardIds: readonly number[],
  difficulty: AIDifficulty,
  random: () => number = Math.random,
): MemoryAIMove | null {
  if (availableCardIds.length < 2) return null;

  const available = new Set(availableCardIds);
  const remembered = revealedMemory.filter((card) => available.has(card.id) && random() < recallRate[difficulty]);
  const cardsByValue = new Map<string, number[]>();
  for (const card of remembered) {
    const ids = cardsByValue.get(card.value) ?? [];
    ids.push(card.id);
    cardsByValue.set(card.value, ids);
  }

  const knownPair = [...cardsByValue.values()].find((ids) => ids.length >= 2);
  if (knownPair) return [knownPair[0], knownPair[1]];

  const firstKnown = remembered[0]?.id;
  const firstId = firstKnown ?? availableCardIds[randomIndex(availableCardIds.length, random)];
  if (firstId === undefined) return null;
  const remaining = availableCardIds.filter((id) => id !== firstId);
  const secondId = remaining[randomIndex(remaining.length, random)];
  return secondId === undefined ? null : [firstId, secondId];
}
