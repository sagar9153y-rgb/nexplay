"use client";

import { ArrowLeft, Bot, Brain, Check, Clock3, RotateCcw, Sparkles, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import RewardStatus from "@/components/games/RewardStatus";
import AIDifficultySelector from "@/components/games/AIDifficultySelector";
import { chooseMemoryAIMove, getMemoryAIDelay } from "@/lib/ai/memory-match";
import { useGameReward } from "@/lib/ai/useGameReward";
import type { GameCompletionMetadata } from "@/lib/progression-client";
import type { AIDifficulty } from "@/lib/ai/types";

type CardValue = "flame" | "zap" | "star" | "crown" | "gem" | "target" | "bolt" | "orbit";
type MemoryCard = { id: number; value: CardValue; revealed: boolean; matched: boolean };
type GameMode = "solo" | "challenge";
type Turn = "player" | "ai";
type GameStatus = "playing" | "complete";

const values: CardValue[] = ["flame", "zap", "star", "crown", "gem", "target", "bolt", "orbit"];
const faces: Record<CardValue, string> = { flame: "✦", zap: "ϟ", star: "✧", crown: "♛", gem: "◆", target: "◎", bolt: "◈", orbit: "◉" };
const colors: Record<CardValue, string> = { flame: "#ff5368", zap: "#ffb54c", star: "#ae69df", crown: "#f1d16a", gem: "#59c7d8", target: "#ff7890", bolt: "#a7dd72", orbit: "#9b7cff" };

function shuffleCards(): MemoryCard[] {
  const deck = [...values, ...values];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[otherIndex]] = [deck[otherIndex], deck[index]];
  }
  return createCards(deck);
}

function createCards(deck: CardValue[]): MemoryCard[] {
  return deck.map((value, id) => ({ id, value, revealed: false, matched: false }));
}

export default function MemoryMatch() {
  const [cards, setCards] = useState<MemoryCard[]>(() => createCards([...values, ...values]));
  const [boardReady, setBoardReady] = useState(false);
  const [mode, setMode] = useState<GameMode>("solo");
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [status, setStatus] = useState<GameStatus>("playing");
  const [activeTurn, setActiveTurn] = useState<Turn>("player");
  const [aiTurnCount, setAiTurnCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [playerPairs, setPlayerPairs] = useState(0);
  const [aiPairs, setAiPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [playerMoves, setPlayerMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const cardsRef = useRef(cards);
  const selectedIdsRef = useRef<number[]>([]);
  const revealedMemoryRef = useRef(new Map<number, CardValue>());
  const sessionIdRef = useRef("");
  const inputLockedRef = useRef(false);
  const generationRef = useRef(0);
  const aiTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const matchedPairs = cards.filter((card) => card.matched).length / 2;
  const result: GameCompletionMetadata["result"] = mode === "solo" ? "complete" : playerPairs > aiPairs ? "win" : aiPairs > playerPairs ? "loss" : "draw";
  const completionMetadata = {
    game_type: "memory-match" as const,
    game_mode: mode,
    ai_difficulty: difficulty,
    result,
    score: playerPairs,
    moves: playerMoves,
    accuracy: null,
    reaction_times: null,
  };
  const { result: reward, loading: rewardLoading, error: rewardError, retry: retryReward } = useGameReward(sessionId, status === "complete", completionMetadata);

  function syncCards(nextCards: MemoryCard[]) {
    cardsRef.current = nextCards;
    setCards(nextCards);
  }

  function ensureSession() {
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
      setSessionId(sessionIdRef.current);
    }
  }

  function clearTimers() {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    aiTimerRef.current = null;
    hideTimerRef.current = null;
    intervalRef.current = null;
  }

  function restartGame(nextMode: GameMode = mode, nextDifficulty: AIDifficulty = difficulty) {
    generationRef.current += 1;
    clearTimers();
    const nextCards = shuffleCards();
    syncCards(nextCards);
    selectedIdsRef.current = [];
    revealedMemoryRef.current.clear();
    sessionIdRef.current = "";
    setSessionId("");
    inputLockedRef.current = false;
    setMode(nextMode);
    setDifficulty(nextDifficulty);
    setStatus("playing");
    setActiveTurn("player");
    setAiTurnCount(0);
    setChecking(false);
    setPlayerPairs(0);
    setAiPairs(0);
    setMoves(0);
    setPlayerMoves(0);
    setSeconds(0);
  }

  useEffect(() => {
    if (status !== "playing") return;
    intervalRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [status]);

  useEffect(() => {
    let active = true;
    const generation = generationRef.current;
    const timer = window.setTimeout(() => {
      if (!active || generation !== generationRef.current) return;
      const shuffledCards = shuffleCards();
      cardsRef.current = shuffledCards;
      setCards(shuffledCards);
      setBoardReady(true);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => () => {
    generationRef.current += 1;
    clearTimers();
  }, []);

  useEffect(() => {
    if (status !== "playing" || mode !== "challenge" || activeTurn !== "ai" || checking) return;
    const generation = generationRef.current;
    inputLockedRef.current = true;
    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      if (generation !== generationRef.current) return;

      const currentCards = cardsRef.current;
      const availableIds = currentCards.filter((card) => !card.matched && !card.revealed).map((card) => card.id);
      const memory = [...revealedMemoryRef.current].map(([id, value]) => ({ id, value }));
      const move = chooseMemoryAIMove(memory, availableIds, difficulty);
      if (!move) {
        inputLockedRef.current = false;
        setActiveTurn("player");
        return;
      }

      const selected = new Set(move);
      const flippedCards = currentCards.map((card) => {
        if (!selected.has(card.id)) return card;
        revealedMemoryRef.current.set(card.id, card.value);
        return { ...card, revealed: true };
      });
      selectedIdsRef.current = [...move];
      setMoves((value) => value + 1);
      setChecking(true);
      const [first, second] = move.map((id) => currentCards.find((card) => card.id === id));
      const isMatch = Boolean(first && second && first.value === second.value);
      const nextCards = flippedCards.map((card) => selected.has(card.id) ? { ...card, matched: isMatch } : card);
      syncCards(nextCards);
      selectedIdsRef.current = [];

      if (isMatch) {
        revealedMemoryRef.current.delete(move[0]);
        revealedMemoryRef.current.delete(move[1]);
        setAiPairs((value) => value + 1);
        setChecking(false);
        inputLockedRef.current = false;
        if (nextCards.every((card) => card.matched)) {
          setStatus("complete");
        } else {
          setAiTurnCount((value) => value + 1);
        }
        return;
      }

      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        if (generation !== generationRef.current) return;
        syncCards(cardsRef.current.map((card) => move.includes(card.id) ? { ...card, revealed: false } : card));
        setChecking(false);
        inputLockedRef.current = false;
        setActiveTurn("player");
      }, 850);
    }, getMemoryAIDelay(difficulty));

    return () => {
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    };
  }, [activeTurn, aiTurnCount, checking, difficulty, mode, status]);

  function handleCardClick(id: number) {
    if (!boardReady || status !== "playing" || checking || inputLockedRef.current || (mode === "challenge" && (activeTurn !== "player" || isAiThinking))) return;
    const currentCards = cardsRef.current;
    const card = currentCards.find((item) => item.id === id);
    if (!card || card.matched || card.revealed) return;

    ensureSession();
    revealedMemoryRef.current.set(card.id, card.value);
    const selectedIds = selectedIdsRef.current;
    if (selectedIds.length === 0) {
      selectedIdsRef.current = [id];
      syncCards(currentCards.map((item) => item.id === id ? { ...item, revealed: true } : item));
      return;
    }

    const firstId = selectedIds[0];
    if (firstId === undefined) return;
    const selected = new Set([firstId, id]);
    const firstCard = currentCards.find((item) => item.id === firstId);
    const isMatch = Boolean(firstCard && firstCard.value === card.value);
    const nextCards = currentCards.map((item) => selected.has(item.id)
      ? { ...item, revealed: true, matched: isMatch }
      : item);
    syncCards(nextCards);
    selectedIdsRef.current = [];
    inputLockedRef.current = true;
    setChecking(true);
    setMoves((value) => value + 1);
    setPlayerMoves((value) => value + 1);

    if (isMatch) {
      revealedMemoryRef.current.delete(firstId);
      revealedMemoryRef.current.delete(id);
      setPlayerPairs((value) => value + 1);
      setChecking(false);
      inputLockedRef.current = false;
      if (nextCards.every((item) => item.matched)) setStatus("complete");
      return;
    }

    const generation = generationRef.current;
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      if (generation !== generationRef.current) return;
      syncCards(cardsRef.current.map((item) => selected.has(item.id) ? { ...item, revealed: false } : item));
      setChecking(false);
      inputLockedRef.current = false;
      if (mode === "challenge") setActiveTurn("ai");
    }, 850);
  }

  const isAiThinking = mode === "challenge" && status === "playing" && activeTurn === "ai";
  const currentTurnLabel = isAiThinking ? "AI is thinking..." : mode === "solo" ? "Your turn" : activeTurn === "player" ? "Your turn" : "AI turn";
  const resultTitle = mode === "solo" ? "Memory Master!"
    : playerPairs > aiPairs ? "Player wins!"
      : aiPairs > playerPairs ? "AI wins"
        : "Draw game";
  const time = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return <section className="mx-auto grid max-w-[950px] gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
    <div className="glass rounded-2xl p-4 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/[.07] pb-5">
        <div><p className="eyebrow mb-2">Focus challenge</p><h2 className="text-sm font-bold text-white">{mode === "challenge" ? "Memory Match · AI Challenge" : "Memory Match · Solo"}</h2></div>
        <div className="flex items-center gap-2 rounded-lg bg-[#ae69df]/10 px-3 py-2 text-xs font-bold text-[#c58cf0]" aria-live="polite">{isAiThinking ? <Bot size={14} className="animate-pulse" /> : <Brain size={14} />}{checking ? "Checking pair..." : currentTurnLabel}</div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">Game mode</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Memory Match mode">
            <button type="button" disabled={moves > 0} aria-pressed={mode === "solo"} onClick={() => restartGame("solo")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${mode === "solo" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e]"}`}><Brain size={14} /> Solo</button>
            <button type="button" disabled={moves > 0} aria-pressed={mode === "challenge"} onClick={() => restartGame("challenge")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${mode === "challenge" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e]"}`}><Users size={14} /> AI Challenge</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">AI difficulty</p>
          <AIDifficultySelector value={difficulty} onChange={(value) => restartGame(mode, value)} disabled={moves > 0 || status === "complete"} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div className="rounded-lg bg-white/[.04] p-3"><Clock3 size={14} className="mx-auto mb-2 text-[#ff5368]" /><div className="text-lg font-black text-white">{time}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Time</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><Sparkles size={14} className="mx-auto mb-2 text-[#ffb54c]" /><div className="text-lg font-black text-white">{moves}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Moves</div></div>
        <div className="rounded-lg bg-[#ff4058]/10 p-3"><Trophy size={14} className="mx-auto mb-2 text-[#ff5368]" /><div className="text-lg font-black text-white">{playerPairs}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Player score</div></div>
        <div className="rounded-lg bg-[#ae69df]/10 p-3"><Bot size={14} className="mx-auto mb-2 text-[#c58cf0]" /><div className="text-lg font-black text-white">{mode === "challenge" ? aiPairs : "—"}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">AI score</div></div>
      </div>

      <p className="mb-3 text-right text-[10px] uppercase tracking-wider text-[#85818e]">Pairs found: {matchedPairs} / 8</p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">{cards.map((card) => {
        const visible = card.revealed || card.matched;
        const disabled = !boardReady || status === "complete" || checking || isAiThinking || (mode === "challenge" && activeTurn !== "player");
        return <button key={card.id} type="button" disabled={disabled || card.matched} onClick={() => handleCardClick(card.id)} aria-label={visible ? `Revealed ${card.value} card` : `Hidden card ${card.id + 1}`} className={`relative aspect-square rounded-xl border text-3xl font-black transition-transform duration-300 [transform-style:preserve-3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff4058] disabled:cursor-not-allowed ${visible ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"} ${card.matched ? "border-[#60dba2]/60 bg-[#60dba2]/10" : visible ? "border-white/[.15] bg-white/[.07]" : "border-white/[.08] bg-white/[.025] hover:border-[#ff4058]/50"}`}><span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]">{visible ? <span style={{ color: colors[card.value] }}>{faces[card.value]}</span> : <span className="text-[#ff4058]/50">?</span>}</span>{card.matched && <Check className="absolute right-2 top-2 text-[#60dba2]" size={13} />}</button>;
      })}</div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-5">
        <p className="text-xs text-[#85818e]" aria-live="polite">{status === "complete" ? "Round complete" : checking ? "Cards revealed" : currentTurnLabel}</p>
        <button type="button" onClick={() => restartGame()} className="ghost-button !px-3 !py-2 text-xs"><RotateCcw size={14} /> Restart Game</button>
      </div>
    </div>

    <aside className="space-y-4">
      <div className="glass grid grid-cols-2 gap-2 rounded-2xl p-4">
        <div className="rounded-lg bg-white/[.04] p-3"><Clock3 size={14} className="mb-2 text-[#ff5368]" /><div className="text-lg font-black text-white">{time}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Time</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><Sparkles size={14} className="mb-2 text-[#ffb54c]" /><div className="text-lg font-black text-white">{moves}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Moves</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><Trophy size={14} className="mb-2 text-[#ff5368]" /><div className="text-lg font-black text-white">{playerPairs}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Player score</div></div>
        <div className="rounded-lg bg-[#ae69df]/10 p-3"><Bot size={14} className="mb-2 text-[#c58cf0]" /><div className="text-lg font-black text-white">{mode === "challenge" ? aiPairs : "—"}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">AI score</div></div>
      </div>
      <RewardStatus result={reward} loading={rewardLoading} error={rewardError} onRetry={retryReward} />
      <div className="glass rounded-2xl p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-white"><Brain size={15} className="text-[#c58cf0]" /> How to play</div><ol className="space-y-2 text-xs leading-5 text-[#85818e]"><li>01 &nbsp;Flip two cards.</li><li>02 &nbsp;Find matching pairs.</li><li>03 &nbsp;In AI Challenge, take turns after misses.</li><li>04 &nbsp;The AI only remembers cards it has seen.</li></ol></div>
    </aside>

    {status === "complete" && <div role="dialog" aria-modal="true" aria-label="Memory game result" className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-[370px] rounded-2xl p-7 text-center"><Trophy className="mx-auto mb-4 text-[#60dba2]" size={28} /><p className="eyebrow mb-3">All pairs matched</p><h2 className="text-3xl font-black text-white">{resultTitle}</h2><div className="mt-6 grid grid-cols-2 gap-3 text-center"><div className="rounded-lg bg-[#ff4058]/10 p-3"><p className="text-xl font-black text-[#ff9ba8]">{playerPairs}</p><p className="text-[10px] uppercase text-[#85818e]">Player pairs</p></div><div className="rounded-lg bg-[#ae69df]/10 p-3"><p className="text-xl font-black text-[#d6b3f3]">{mode === "challenge" ? aiPairs : "—"}</p><p className="text-[10px] uppercase text-[#85818e]">AI pairs</p></div></div><RewardStatus result={reward} loading={rewardLoading} error={rewardError} onRetry={retryReward} /><button type="button" onClick={() => restartGame()} className="accent-button mt-7 w-full">Play Again</button><button type="button" onClick={() => restartGame(mode === "solo" ? "challenge" : "solo")} className="ghost-button mt-3 w-full">Change Mode</button><a href="/games" className="mt-4 inline-flex items-center gap-1 text-xs text-[#85818e] hover:text-white"><ArrowLeft size={13} /> Back to Games</a></motion.div></div>}
  </section>;
}
