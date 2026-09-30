"use client";

import { ArrowLeft, Bot, RotateCcw, Sparkles, Trophy, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { calculateGameReward } from "@/lib/progression";
import RewardStatus from "@/components/games/RewardStatus";
import AIDifficultySelector from "@/components/games/AIDifficultySelector";
import { chooseTicTacToeMove, type TicTacToeCell, type TicTacToeDifficulty, type TicTacToeMark } from "@/lib/ticTacToeAI";
import { useGameReward } from "@/lib/ai/useGameReward";

type Mark = TicTacToeMark;
type Cell = TicTacToeCell;
type Score = { x: number; o: number; draws: number };
type GameMode = "ai" | "pvp";

const winningLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function findWinner(board: Cell[]) {
  for (const line of winningLines) {
    const [first, second, third] = line;
    if (board[first] && board[first] === board[second] && board[first] === board[third]) return { mark: board[first], line };
  }
  return null;
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Mark>("X");
  const [winner, setWinner] = useState<Mark | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [score, setScore] = useState<Score>({ x: 0, o: 0, draws: 0 });
  const [sessionId, setSessionId] = useState("");
  const [mode, setMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<TicTacToeDifficulty>("medium");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiTimerRef = useRef<number | null>(null);
  const aiThinkingRef = useRef(false);
  const roundRef = useRef(0);

  useEffect(() => () => {
    roundRef.current += 1;
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
  }, []);

  function clearAiTurn() {
    roundRef.current += 1;
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    aiTimerRef.current = null;
    aiThinkingRef.current = false;
    setIsAiThinking(false);
  }

  function applyMove(index: number, mark: Mark, startingBoard: Cell[]): Cell[] | null {
    if (index < 0 || index >= 9 || startingBoard[index] !== null) return null;
    const nextBoard = [...startingBoard];
    nextBoard[index] = mark;
    const result = findWinner(nextBoard);
    setBoard(nextBoard);
    if (result) {
      setWinner(result.mark);
      setWinningCells(result.line);
      setScore((previous) => ({ ...previous, [result.mark === "X" ? "x" : "o"]: previous[result.mark === "X" ? "x" : "o"] + 1 }));
      return null;
    }
    if (nextBoard.every(Boolean)) {
      setWinner("draw");
      setScore((previous) => ({ ...previous, draws: previous.draws + 1 }));
      return null;
    }
    setCurrentPlayer(mark === "X" ? "O" : "X");
    return nextBoard;
  }

  function handleMove(index: number) {
    if (board[index] || winner || isAiThinking || aiThinkingRef.current) return;
    if (mode === "ai" && currentPlayer !== "X") return;
    if (!sessionId) setSessionId(crypto.randomUUID());

    const nextBoard = applyMove(index, currentPlayer, board);
    if (!nextBoard || mode !== "ai") return;

    aiThinkingRef.current = true;
    setIsAiThinking(true);
    const round = roundRef.current;
    const wait = 550;
    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      if (round !== roundRef.current) return;
      const aiMove = chooseTicTacToeMove(nextBoard, difficulty, "O");
      if (aiMove !== null && nextBoard[aiMove] === null) applyMove(aiMove, "O", nextBoard);
      aiThinkingRef.current = false;
      setIsAiThinking(false);
    }, wait);
  }

  function resetBoard() {
    clearAiTurn();
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningCells([]);
    setSessionId(crypto.randomUUID());
  }

  function selectMode(nextMode: GameMode) {
    if (nextMode === mode) return;
    resetBoard();
    setMode(nextMode);
  }

  function selectDifficulty(nextDifficulty: TicTacToeDifficulty) {
    if (nextDifficulty === difficulty) return;
    resetBoard();
    setDifficulty(nextDifficulty);
  }

  const roundStarted = board.some(Boolean);
  const turnLabel = isAiThinking ? "AI is thinking..." : mode === "ai"
    ? currentPlayer === "X" ? "Your turn · X" : "AI turn · O"
    : `Player ${currentPlayer}'s turn`;
  const resultTitle = winner === "draw" ? "Draw Game"
    : mode === "ai" ? winner === "X" ? "You Win!" : "AI Wins"
      : `Player ${winner} Wins!`;
  const outcome = winner === "draw" ? "draw" : winner === "X" ? "win" : "loss";
  const rewardXp = winner ? calculateGameReward({ game: "tic-tac-toe", outcome }) : 10;
  const { result: reward, loading: rewardLoading, error: rewardError } = useGameReward(sessionId, Boolean(winner), rewardXp, {
    game_type: "tic-tac-toe",
    game_mode: mode,
    ai_difficulty: mode === "ai" ? difficulty : null,
    result: winner ? outcome : "complete",
    score: board.filter(Boolean).length,
    moves: board.filter(Boolean).length,
    accuracy: null,
    reaction_times: null,
  });

  return <section className="mx-auto grid max-w-[900px] gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
    <div className="glass rounded-2xl p-4 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/[.07] pb-5">
        <div><p className="eyebrow mb-2">Skill match</p><h2 className="text-sm font-bold text-white">{mode === "ai" ? "Play vs AI" : "Player vs Player"}</h2></div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${isAiThinking ? "bg-[#ffb54c]/10 text-[#ffcf7b]" : "bg-[#ff4058]/10 text-[#ff6879]"}`} aria-live="polite">
          {isAiThinking ? <Bot size={14} className="animate-pulse" /> : <span className="h-2 w-2 rounded-full bg-[#ff4058]" />}{turnLabel}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">Game mode</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Game mode">
            <button type="button" onClick={() => selectMode("ai")} disabled={roundStarted} aria-pressed={mode === "ai"} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${mode === "ai" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e] hover:border-white/20"}`}><Bot size={14} /> vs AI</button>
            <button type="button" onClick={() => selectMode("pvp")} disabled={roundStarted} aria-pressed={mode === "pvp"} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${mode === "pvp" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e] hover:border-white/20"}`}><Users size={14} /> vs Player</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">AI difficulty</p>
          <AIDifficultySelector value={difficulty} onChange={selectDifficulty} disabled={mode !== "ai" || roundStarted} />
        </div>
      </div>

      <div className="mx-auto grid max-w-[500px] grid-cols-3 gap-2 sm:gap-3">{board.map((cell, index) => {
        const disabled = Boolean(cell) || Boolean(winner) || isAiThinking || (mode === "ai" && currentPlayer !== "X");
        return <motion.button key={index} type="button" disabled={disabled} whileHover={!disabled ? { scale: .96 } : undefined} whileTap={!disabled ? { scale: .9 } : undefined} onClick={() => handleMove(index)} aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ""}`} className={`flex aspect-square items-center justify-center rounded-xl border text-[clamp(42px,10vw,76px)] font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff4058] disabled:cursor-not-allowed ${winningCells.includes(index) ? "border-[#ff4058] bg-[#ff4058]/20 shadow-[0_0_30px_rgba(255,64,88,.25)]" : "border-white/[.08] bg-white/[.025] enabled:hover:border-white/20 enabled:hover:bg-white/[.06]"} ${cell === "X" ? "text-[#ff5368]" : "text-[#ae69df]"}`}>{cell}</motion.button>;
      })}</div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-5">
        <p className="text-xs text-[#85818e]" aria-live="polite">{winner ? "Round complete" : turnLabel}</p>
        <button type="button" onClick={resetBoard} className="ghost-button !px-3 !py-2 text-xs"><RotateCcw size={14} /> Restart Game</button>
      </div>
    </div>

    <aside className="space-y-4">
      <div className="glass rounded-2xl p-5"><div className="mb-4 flex items-center gap-2 text-xs font-bold text-white"><Trophy size={15} className="text-[#ffb54c]" /> Scoreboard</div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-[#ff4058]/10 p-3"><div className="text-xl font-black text-[#ff5368]">{score.x}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">X Wins</div></div><div className="rounded-lg bg-[#ae69df]/10 p-3"><div className="text-xl font-black text-[#ae69df]">{score.o}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">{mode === "ai" ? "AI Wins" : "O Wins"}</div></div><div className="rounded-lg bg-white/[.04] p-3"><div className="text-xl font-black text-white">{score.draws}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">Draws</div></div></div></div>
      <div className="glass rounded-2xl p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-white"><Sparkles size={15} className="text-[#ffb54c]" /> How to play</div><p className="text-xs leading-6 text-[#85818e]">Take turns placing your mark. Get three in a row horizontally, vertically, or diagonally to win.</p><div className="mt-4 flex items-center gap-2 text-[11px] text-[#85818e]"><span className="font-black text-[#ff5368]">X</span> You <span className="mx-1 text-white/20">vs</span> <span className="font-black text-[#ae69df]">O</span> {mode === "ai" ? "AI" : "Player O"}</div></div>
    </aside>

    {winner && <div role="dialog" aria-modal="true" aria-label="Game result" className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-[340px] rounded-2xl p-7 text-center"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff4058]/15 text-[#ff5368]">{winner === "draw" ? <X size={25} /> : <Trophy size={25} />}</div><p className="eyebrow mb-3">Round complete</p><h2 className="text-3xl font-black tracking-tight text-white">{resultTitle}</h2><RewardStatus result={reward} loading={rewardLoading} error={rewardError} /><button type="button" onClick={resetBoard} className="accent-button mt-7 w-full">Play Again</button><a href="/games" className="mt-4 inline-flex items-center gap-1 text-xs text-[#85818e] hover:text-white"><ArrowLeft size={13} /> Back to Games</a></motion.div></div>}
  </section>;
}