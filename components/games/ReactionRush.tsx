"use client";

import { ArrowLeft, Bot, Clock3, RotateCcw, Target, Trophy, Users, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AIDifficultySelector from "@/components/games/AIDifficultySelector";
import RewardStatus from "@/components/games/RewardStatus";
import { calculateAverage, calculateConsistency, createReactionBenchmarkTime } from "@/lib/ai/reaction-benchmark";
import { useGameReward } from "@/lib/ai/useGameReward";
import type { AIDifficulty } from "@/lib/ai/types";
import type { GameCompletionMetadata } from "@/lib/progression-client";

type GameMode = "solo" | "benchmark";
type Phase = "ready" | "countdown" | "waiting" | "target" | "result" | "tooEarly" | "complete";

const waitRanges: Record<AIDifficulty, readonly [number, number]> = {
  easy: [1900, 3300],
  medium: [1500, 2900],
  hard: [1200, 2600],
};

function getPerformance(reactionTime: number) {
  if (reactionTime < 200) return "Lightning fast";
  if (reactionTime < 300) return "Excellent";
  if (reactionTime < 400) return "Great";
  if (reactionTime < 500) return "Good";
  return "Keep practicing";
}

export default function ReactionRush() {
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [mode, setMode] = useState<GameMode>("solo");
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [round, setRound] = useState(1);
  const [playerTimes, setPlayerTimes] = useState<number[]>([]);
  const [aiTimes, setAiTimes] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const targetStartedAtRef = useRef(0);
  const playerTimesRef = useRef<number[]>([]);
  const aiTimesRef = useRef<number[]>([]);
  const aiTimerRef = useRef<number | null>(null);
  const completed = mode === "solo" ? phase === "result" : phase === "complete";
  const playerAverage = calculateAverage(playerTimes);
  const aiAverage = calculateAverage(aiTimes);
  const playerBest = playerTimes.length > 0 ? Math.min(...playerTimes) : 0;
  const aiBest = aiTimes.length > 0 ? Math.min(...aiTimes) : 0;
  const playerConsistency = calculateConsistency(playerTimes);
  const aiConsistency = calculateConsistency(aiTimes);
  const benchmarkResult: GameCompletionMetadata["result"] = playerAverage < aiAverage ? "win" : playerAverage > aiAverage ? "loss" : "draw";
  const completionMetadata = {
    game_type: "reaction-rush" as const,
    game_mode: mode,
    ai_difficulty: difficulty,
    result: mode === "solo" ? "complete" as const : benchmarkResult,
    score: null,
    moves: null,
    accuracy: null,
    reaction_times: playerTimes,
  };
  const { result: reward, loading: rewardLoading, error: rewardErrorMessage, retry: retryReward } = useGameReward(sessionId, completed, completionMetadata);
  const resultTitle = mode === "solo" ? "Test complete"
    : playerAverage < aiAverage ? "You beat the benchmark!"
      : playerAverage > aiAverage ? "AI benchmark wins"
        : "Benchmark tie";

  function clearTimers() {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
    aiTimerRef.current = null;
  }

  useEffect(() => () => {
    generationRef.current += 1;
    clearTimers();
  }, []);

  function beginWaiting(nextRound: number, generation: number, nextMode: GameMode, nextDifficulty: AIDifficulty) {
    if (generation !== generationRef.current) return;
    setPhase("waiting");
    const [minimum, maximum] = waitRanges[nextDifficulty];
    const delay = minimum + Math.random() * (maximum - minimum);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (generation !== generationRef.current) return;
      targetStartedAtRef.current = performance.now();
      setRound(nextRound);
      setMode(nextMode);
      setPhase("target");
    }, delay);
  }

  function startRound(nextRound: number, nextMode: GameMode, nextDifficulty: AIDifficulty) {
    clearTimers();
    const generation = generationRef.current;
    setRound(nextRound);
    setCountdown(3);
    setLastTime(null);
    setPhase("countdown");
    let remaining = 3;
    intervalRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setPhase("waiting");
        timeoutRef.current = window.setTimeout(() => beginWaiting(nextRound, generation, nextMode, nextDifficulty), 400);
      }
    }, 700);
  }

  function startGame(nextMode: GameMode = mode, nextDifficulty: AIDifficulty = difficulty) {
    generationRef.current += 1;
    clearTimers();
    playerTimesRef.current = [];
    aiTimesRef.current = [];
    setPlayerTimes([]);
    setAiTimes([]);
    setLastTime(null);
    setMode(nextMode);
    setDifficulty(nextDifficulty);
    setIsAiThinking(false);
    setSessionId(crypto.randomUUID());
    startRound(1, nextMode, nextDifficulty);
  }

  function handleArenaClick() {
    if (phase !== "waiting" && phase !== "countdown") return;
    generationRef.current += 1;
    clearTimers();
    setPhase("tooEarly");
  }

  function handleTargetClick() {
    if (phase !== "target") return;
    const currentTime = Math.max(1, Math.round(performance.now() - targetStartedAtRef.current));
    const nextPlayerTimes = [...playerTimesRef.current, currentTime];
    playerTimesRef.current = nextPlayerTimes;
    setPlayerTimes(nextPlayerTimes);
    setLastTime(currentTime);
    setPhase("result");

    if (mode === "solo") {
      return;
    }

    setIsAiThinking(true);
    const nextRound = round;
    const generation = generationRef.current;
    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      if (generation !== generationRef.current) return;
      const aiTime = createReactionBenchmarkTime(difficulty);
      const nextAiTimes = [...aiTimesRef.current, aiTime];
      aiTimesRef.current = nextAiTimes;
      setAiTimes(nextAiTimes);
      setIsAiThinking(false);
      if (nextRound >= 5) setPhase("complete");
      else setPhase("result");
    }, 550);
  }

  function nextRound() {
    if (phase !== "result" || mode !== "benchmark") return;
    startRound(round + 1, mode, difficulty);
  }

  const roundsCompleted = mode === "benchmark" ? playerTimes.length : phase === "result" ? 1 : 0;
  const aiThinking = mode === "benchmark" && isAiThinking;

  return <section className="mx-auto grid max-w-[950px] gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
    <div className="glass rounded-2xl p-4 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/[.07] pb-5">
        <div><p className="eyebrow mb-2">Reaction test</p><h2 className="text-sm font-bold text-white">{mode === "benchmark" ? `AI Benchmark · Round ${Math.min(round, 5)} / 5` : "How fast can you react?"}</h2></div>
        {phase !== "ready" && <div className="flex items-center gap-2 rounded-lg bg-[#ff4058]/10 px-3 py-2 text-xs font-bold text-[#ff6879]"><span className="h-2 w-2 rounded-full bg-[#ff4058]" /> {difficulty}</div>}
      </div>

      {phase === "ready" && <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">Mode</p><div className="grid grid-cols-2 gap-2" role="group" aria-label="Reaction Rush mode">
          <button type="button" aria-pressed={mode === "solo"} onClick={() => setMode("solo")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${mode === "solo" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e]"}`}><Target size={14} /> Solo</button>
          <button type="button" aria-pressed={mode === "benchmark"} onClick={() => setMode("benchmark")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${mode === "benchmark" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e]"}`}><Users size={14} /> AI Benchmark</button>
        </div></div>
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">Benchmark difficulty</p><AIDifficultySelector value={difficulty} onChange={setDifficulty} disabled={mode === "solo"} /></div>
      </div>}

      <motion.div layout className={`relative flex min-h-[390px] flex-col items-center justify-center overflow-hidden rounded-xl border border-white/[.07] p-5 text-center transition-colors ${phase === "target" ? "cursor-pointer bg-[#60dba2]" : "bg-[radial-gradient(circle_at_center,rgba(128,52,161,.18),transparent_65%)]"}`} onClick={phase === "target" ? handleTargetClick : handleArenaClick} role={phase === "target" ? "button" : undefined} tabIndex={phase === "target" ? 0 : undefined} onKeyDown={phase === "target" ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleTargetClick(); } } : undefined} aria-label={phase === "target" ? "Target appeared. Activate to record your reaction time" : undefined}>
        {phase === "ready" && <><Zap className="mb-5 text-[#ff4058]" size={42} fill="currentColor" /><h2 className="text-3xl font-black text-white">READY?</h2><p className="mt-3 max-w-xs text-xs leading-6 text-[#85818e]">{mode === "benchmark" ? "Complete five rounds against a realistic AI reaction benchmark." : "Wait for the target, then react as fast as you can."}</p><p className="mt-7 flex items-center justify-center gap-2 text-xs text-[#85818e]"><Bot size={14} className="text-[#c58cf0]" /> Benchmark responses stay within realistic human ranges.</p><button type="button" onClick={(event) => { event.stopPropagation(); startGame(); }} className="accent-button mt-8">{mode === "benchmark" ? "Start Benchmark" : "Start Test"} <Target size={15} /></button></>}
        {phase === "countdown" && <><div className="text-7xl font-black text-white">{countdown || "GO"}</div><p className="mt-4 text-xs text-[#85818e]">Get ready...</p></>}
        {phase === "waiting" && <><Clock3 className="mb-5 text-[#ffb54c]" size={42} /><h2 className="text-3xl font-black text-white">WAIT FOR GREEN</h2><p className="mt-3 text-xs text-[#85818e]">Click only when the target appears.</p></>}
        {phase === "target" && <><Zap className="mb-5 text-[#07120c]" size={52} fill="currentColor" /><h2 className="text-4xl font-black text-[#07120c]">TAP NOW</h2><p className="mt-3 text-xs font-bold text-[#102419]">Tap, click, Enter, or Space</p></>}
        {phase === "tooEarly" && <><X className="mb-5 text-[#ff5368]" size={42} /><h2 className="text-3xl font-black text-white">TOO EARLY</h2><p className="mt-3 text-xs text-[#85818e]">Wait for green before reacting.</p><button type="button" onClick={(event) => { event.stopPropagation(); startGame(); }} className="accent-button mt-7">Try Again</button></>}
        {phase === "result" && <><Trophy className="mb-5 text-[#ffb54c]" size={42} /><p className="eyebrow mb-2">Round {round} result</p><h2 className="text-5xl font-black text-white">{lastTime} <span className="text-xl">ms</span></h2><p className="mt-3 text-xs text-[#85818e]">{getPerformance(lastTime ?? 500)}</p>{mode === "benchmark" && <div className="mt-6 flex min-h-14 items-center justify-center gap-2 text-xs text-[#c58cf0]" aria-live="polite">{aiThinking ? <><Bot size={15} className="animate-pulse" /> AI is thinking...</> : <span>AI benchmark: {aiTimes[aiTimes.length - 1] ?? "—"} ms</span>}</div>}{mode === "benchmark" && !aiThinking && <button type="button" onClick={(event) => { event.stopPropagation(); nextRound(); }} className="accent-button mt-6">Next Round</button>}</>}
        {phase === "complete" && <><Trophy className="mb-5 text-[#ffb54c]" size={42} /><p className="eyebrow mb-2">Five rounds completed</p><h2 className="text-3xl font-black text-white">Benchmark complete</h2><p className="mt-3 text-xs text-[#85818e]">{resultTitle}</p></>}
      </motion.div>

      {mode === "benchmark" && phase !== "ready" && <div className="mt-4 flex items-center justify-between text-xs text-[#85818e]"><span>Rounds completed</span><span className="font-bold text-white">{roundsCompleted} / 5</span></div>}
      {(phase !== "ready") && <button type="button" onClick={() => startGame()} className="ghost-button mt-4 w-full"><RotateCcw size={14} /> Restart {mode === "benchmark" ? "Benchmark" : "Test"}</button>}
    </div>

    <aside className="space-y-4">
      <div className="glass rounded-2xl p-5"><div className="mb-4 flex items-center gap-2 text-xs font-bold text-white"><Bot size={15} className="text-[#c58cf0]" /> {mode === "benchmark" ? "AI Benchmark" : "Your performance"}</div><div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-[#ff4058]/10 p-3"><div className="text-lg font-black text-[#ff9ba8]">{mode === "benchmark" ? playerAverage || "—" : lastTime ?? "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">Player average</div></div>
        <div className="rounded-lg bg-[#ff4058]/10 p-3"><div className="text-lg font-black text-[#ff9ba8]">{playerBest || "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">Player best</div></div>
        <div className="rounded-lg bg-[#ae69df]/10 p-3"><div className="text-lg font-black text-[#d6b3f3]">{mode === "benchmark" ? aiAverage || "—" : "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">AI average</div></div>
        <div className="rounded-lg bg-[#ae69df]/10 p-3"><div className="text-lg font-black text-[#d6b3f3]">{mode === "benchmark" ? aiBest || "—" : "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">AI best</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><div className="text-lg font-black text-white">{playerConsistency || "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">Player variance</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><div className="text-lg font-black text-white">{mode === "benchmark" ? aiConsistency || "—" : "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">AI variance</div></div>
      </div><p className="mt-4 text-[10px] leading-5 text-[#85818e]">Lower reaction time is better. Variance compares consistency across rounds.</p></div>
      <RewardStatus result={reward} loading={rewardLoading} error={rewardErrorMessage} onRetry={retryReward} />
      <div className="glass rounded-2xl p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-white"><Target size={15} className="text-[#ff5368]" /> How to play</div><p className="text-xs leading-6 text-[#85818e]">Wait for green, then tap or press Enter/Space. The AI benchmark is sampled in a realistic range for its selected difficulty.</p></div>
    </aside>

    {completed && <div role="dialog" aria-modal="true" aria-label="Reaction Rush result" className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-[390px] rounded-2xl p-7 text-center"><Trophy className="mx-auto mb-4 text-[#ffb54c]" size={30} /><p className="eyebrow mb-2">{mode === "benchmark" ? "5 round benchmark" : "Solo test"}</p><h2 className="text-2xl font-black text-white">{resultTitle}</h2>{mode === "benchmark" && <div className="mt-5 grid grid-cols-2 gap-2 text-sm"><p className="rounded-lg bg-[#ff4058]/10 p-3 text-[#ff9ba8]">Player avg {playerAverage} ms</p><p className="rounded-lg bg-[#ae69df]/10 p-3 text-[#d6b3f3]">AI avg {aiAverage} ms</p><p className="rounded-lg bg-[#ff4058]/10 p-3 text-[#ff9ba8]">Player best {playerBest} ms</p><p className="rounded-lg bg-[#ae69df]/10 p-3 text-[#d6b3f3]">AI best {aiBest} ms</p></div>}<RewardStatus result={reward} loading={rewardLoading} error={rewardErrorMessage} onRetry={retryReward} /><button type="button" onClick={() => startGame()} className="accent-button mt-7 w-full">Play Again</button><button type="button" onClick={() => { setPhase("ready"); setLastTime(null); }} className="ghost-button mt-3 w-full">Change Mode</button><a href="/games" className="mt-4 inline-flex items-center gap-1 text-xs text-[#85818e] hover:text-white"><ArrowLeft size={13} /> Back to Games</a></motion.div></div>}
  </section>;
}
