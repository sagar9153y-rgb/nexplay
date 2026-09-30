import type { AIDifficulty } from "@/lib/ai/types";

export type TicTacToeMark = "X" | "O";
export type TicTacToeCell = TicTacToeMark | null;
export type TicTacToeDifficulty = AIDifficulty;
export type TicTacToeBoard = readonly TicTacToeCell[];

const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(board: TicTacToeBoard): TicTacToeMark | null {
  for (const [first, second, third] of WINNING_LINES) {
    const mark = board[first];
    if (mark && mark === board[second] && mark === board[third]) return mark;
  }
  return null;
}

function getAvailableMoves(board: TicTacToeBoard): number[] {
  return board.flatMap((cell, index) => cell === null ? [index] : []);
}

function findImmediateMove(board: TicTacToeBoard, mark: TicTacToeMark): number | null {
  for (const index of getAvailableMoves(board)) {
    const candidate = [...board];
    candidate[index] = mark;
    if (getWinner(candidate) === mark) return index;
  }
  return null;
}

function chooseRandom(moves: number[], random: () => number): number | null {
  if (moves.length === 0) return null;
  const index = Math.min(moves.length - 1, Math.floor(random() * moves.length));
  return moves[index] ?? null;
}

function chooseStrategicMove(board: TicTacToeBoard, moves: number[], random: () => number): number | null {
  const center = 4;
  if (moves.includes(center)) return center;

  const corners = moves.filter((index) => index % 2 === 0 && index !== center);
  if (corners.length > 0 && random() < 0.75) return chooseRandom(corners, random);
  return chooseRandom(moves, random);
}

function minimax(
  board: TicTacToeCell[],
  currentMark: TicTacToeMark,
  aiMark: TicTacToeMark,
  opponentMark: TicTacToeMark,
  depth: number,
): number {
  const winner = getWinner(board);
  if (winner === aiMark) return 10 - depth;
  if (winner === opponentMark) return depth - 10;

  const moves = getAvailableMoves(board);
  if (moves.length === 0) return 0;

  const maximizing = currentMark === aiMark;
  let bestScore = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (const index of moves) {
    board[index] = currentMark;
    const score = minimax(board, currentMark === aiMark ? opponentMark : aiMark, aiMark, opponentMark, depth + 1);
    board[index] = null;
    bestScore = maximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
  }
  return bestScore;
}

function chooseOptimalMove(
  board: TicTacToeBoard,
  moves: number[],
  aiMark: TicTacToeMark,
  opponentMark: TicTacToeMark,
  random: () => number,
): number | null {
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: number[] = [];
  for (const index of moves) {
    const candidate = [...board];
    candidate[index] = aiMark;
    const score = minimax(candidate, opponentMark, aiMark, opponentMark, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [index];
    } else if (score === bestScore) {
      bestMoves.push(index);
    }
  }
  return chooseRandom(bestMoves, random);
}

/** Returns a legal local AI move, or null when the board is invalid or full. */
export function chooseTicTacToeMove(
  board: TicTacToeBoard,
  difficulty: TicTacToeDifficulty,
  aiMark: TicTacToeMark = "O",
  random: () => number = Math.random,
): number | null {
  if (board.length !== 9 || !["easy", "medium", "hard"].includes(difficulty)) return null;

  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;
  const opponentMark: TicTacToeMark = aiMark === "X" ? "O" : "X";

  if (difficulty === "hard") return chooseOptimalMove(board, moves, aiMark, opponentMark, random);
  if (difficulty === "medium") {
    const winningMove = findImmediateMove(board, aiMark);
    if (winningMove !== null) return winningMove;
    const blockingMove = findImmediateMove(board, opponentMark);
    if (blockingMove !== null) return blockingMove;
    return random() < 0.7
      ? chooseStrategicMove(board, moves, random)
      : chooseRandom(moves, random);
  }

  // Easy play is deliberately unpredictable, with occasional center/corner preference.
  return random() < 0.8
    ? chooseRandom(moves, random)
    : chooseStrategicMove(board, moves, random);
}
