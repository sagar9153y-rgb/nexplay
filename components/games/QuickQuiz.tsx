"use client";

import { Bot, Check, Clock3, RotateCcw, Sparkles, Trophy, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import AIDifficultySelector from "@/components/games/AIDifficultySelector";
import RewardStatus from "@/components/games/RewardStatus";
import { chooseQuizAnswer, getQuizResponseDelay } from "@/lib/ai/difficulty";
import { getQuizQuestions, type QuizQuestion } from "@/lib/ai/quiz-generator";
import { useGameReward } from "@/lib/ai/useGameReward";
import type { AIDifficulty } from "@/lib/ai/types";
import { calculateGameReward } from "@/lib/progression";

type GameMode = "solo" | "battle";
type QuizPhase = "ready" | "loading" | "playing" | "complete";
type AnswerRecord = { optionIndex: number | null; correct: boolean; responseTimeMs: number };

const QUESTION_SECONDS = 15;

export default function QuickQuiz() {
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [mode, setMode] = useState<GameMode>("solo");
  const [phase, setPhase] = useState<QuizPhase>("ready");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_SECONDS);
  const [playerAnswers, setPlayerAnswers] = useState<Map<number, AnswerRecord>>(new Map());
  const [aiAnswers, setAiAnswers] = useState<Map<number, AnswerRecord>>(new Map());
  const [sessionId, setSessionId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const aiTimerRef = useRef<number | null>(null);
  const advanceRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const questionStartedAtRef = useRef(0);
  const playerAnswersRef = useRef(new Map<number, AnswerRecord>());
  const aiAnswersRef = useRef(new Map<number, AnswerRecord>());
  const answeredByAiRef = useRef(new Set<number>());
  const advanceScheduledRef = useRef(new Set<number>());

  const correctAnswers = [...playerAnswers.values()].filter((answer) => answer.correct).length;
  const incorrectAnswers = [...playerAnswers.values()].filter((answer) => !answer.correct).length;
  const aiCorrectAnswers = [...aiAnswers.values()].filter((answer) => answer.correct).length;
  const playerScore = correctAnswers * 100;
  const aiScore = aiCorrectAnswers * 100;
  const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
  const aiAccuracy = questions.length > 0 ? Math.round((aiCorrectAnswers / questions.length) * 100) : 0;
  const playerResponseTimes = [...playerAnswers.values()].map((answer) => answer.responseTimeMs);
  const aiResponseTimes = [...aiAnswers.values()].map((answer) => answer.responseTimeMs);
  const playerAverageResponse = playerResponseTimes.length > 0 ? Math.round(playerResponseTimes.reduce((sum, time) => sum + time, 0) / playerResponseTimes.length) : 0;
  const aiAverageResponse = aiResponseTimes.length > 0 ? Math.round(aiResponseTimes.reduce((sum, time) => sum + time, 0) / aiResponseTimes.length) : 0;
  const currentQuestion = questions[questionIndex];
  const currentPlayerAnswer = playerAnswers.get(questionIndex);
  const currentAiAnswer = aiAnswers.get(questionIndex);
  const aiThinking = mode === "battle" && phase === "playing" && !currentAiAnswer;
  const localXp = calculateGameReward({ game: "quick-quiz", correctAnswers });
  const resultTitle = mode === "solo" ? "Quiz complete"
    : playerScore > aiScore ? "You win!"
      : aiScore > playerScore ? "AI wins"
        : "Draw game";
  const completionMetadata = {
    game_type: "quick-quiz" as const,
    game_mode: mode,
    ai_difficulty: difficulty,
    result: mode === "solo" ? "complete" as const : playerScore > aiScore ? "win" as const : aiScore > playerScore ? "loss" as const : "draw" as const,
    score: playerScore,
    moves: null,
    accuracy,
    reaction_times: null,
  };
  const { result: reward, loading: rewardLoading, error: rewardError } = useGameReward(sessionId, phase === "complete", localXp, completionMetadata);

  function clearTimers() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    if (advanceRef.current !== null) window.clearTimeout(advanceRef.current);
    timerRef.current = null;
    aiTimerRef.current = null;
    advanceRef.current = null;
  }

  const scheduleAdvance = useCallback((answerIndex: number, generation: number) => {
    if (generation !== generationRef.current || advanceScheduledRef.current.has(answerIndex)) return;
    if (mode === "battle" && !aiAnswersRef.current.has(answerIndex)) return;
    if (!playerAnswersRef.current.has(answerIndex)) return;
    advanceScheduledRef.current.add(answerIndex);
    advanceRef.current = window.setTimeout(() => {
      advanceRef.current = null;
      if (generation !== generationRef.current) return;
      if (answerIndex >= questions.length - 1) {
        setPhase("complete");
        return;
      }
      setQuestionIndex(answerIndex + 1);
      setTimeRemaining(QUESTION_SECONDS);
      questionStartedAtRef.current = performance.now();
    }, 850);
  }, [mode, questions.length]);

  const submitAnswer = useCallback((optionIndex: number | null, answerIndex: number) => {
    if (phase !== "playing" || playerAnswersRef.current.has(answerIndex)) return;
    const question = questions[answerIndex];
    if (!question) return;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const correct = optionIndex === question.correctAnswer;
    const responseTimeMs = Math.max(0, Math.round(performance.now() - questionStartedAtRef.current));
    const answer: AnswerRecord = { optionIndex, correct, responseTimeMs };
    playerAnswersRef.current.set(answerIndex, answer);
    setPlayerAnswers(new Map(playerAnswersRef.current));
    scheduleAdvance(answerIndex, generationRef.current);
  }, [phase, questions, scheduleAdvance]);

  useEffect(() => {
    if (phase !== "playing" || !currentQuestion || playerAnswers.has(questionIndex)) return;
    questionStartedAtRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      setTimeRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [currentQuestion, phase, playerAnswers, questionIndex]);

  useEffect(() => {
    if (phase !== "playing" || mode !== "battle" || !currentQuestion || aiAnswers.has(questionIndex)) return;
    const generation = generationRef.current;
    const delay = getQuizResponseDelay(difficulty);
    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      if (generation !== generationRef.current || answeredByAiRef.current.has(questionIndex)) return;
      answeredByAiRef.current.add(questionIndex);
      const response = chooseQuizAnswer(currentQuestion.correctAnswer, currentQuestion.options.length, difficulty);
      const isCorrect = response.optionIndex === currentQuestion.correctAnswer;
      const answer: AnswerRecord = { optionIndex: response.optionIndex, correct: isCorrect, responseTimeMs: delay };
      aiAnswersRef.current.set(questionIndex, answer);
      setAiAnswers(new Map(aiAnswersRef.current));
      scheduleAdvance(questionIndex, generation);
    }, delay);
    return () => {
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    };
  }, [aiAnswers, currentQuestion, difficulty, mode, phase, questionIndex, scheduleAdvance]);

  useEffect(() => {
    if (phase !== "playing" || timeRemaining > 0 || !currentQuestion || playerAnswersRef.current.has(questionIndex)) return;
    submitAnswer(null, questionIndex);
  }, [phase, timeRemaining, currentQuestion, questionIndex, submitAnswer]);

  useEffect(() => () => {
    generationRef.current += 1;
    clearTimers();
  }, []);

  async function startQuiz(nextMode: GameMode = mode, nextDifficulty: AIDifficulty = difficulty) {
    generationRef.current += 1;
    clearTimers();
    const generation = generationRef.current;
    setPhase("loading");
    setLoadError(null);
    try {
      const loadedQuestions = await getQuizQuestions();
      if (generation !== generationRef.current) return;
      setQuestions(loadedQuestions);
      setMode(nextMode);
      setDifficulty(nextDifficulty);
      setQuestionIndex(0);
      setTimeRemaining(QUESTION_SECONDS);
      playerAnswersRef.current.clear();
      aiAnswersRef.current.clear();
      answeredByAiRef.current.clear();
      advanceScheduledRef.current.clear();
      setPlayerAnswers(new Map());
      setAiAnswers(new Map());
      setSessionId(crypto.randomUUID());
      questionStartedAtRef.current = performance.now();
      setPhase("playing");
    } catch {
      if (generation === generationRef.current) {
        setLoadError("Questions could not be loaded. Please try again.");
        setPhase("ready");
      }
    }
  }

  function answerQuestion(optionIndex: number) {
    submitAnswer(optionIndex, questionIndex);
  }

  function returnToSetup() {
    generationRef.current += 1;
    clearTimers();
    setPhase("ready");
    setLoadError(null);
  }

  const feedbackVisible = Boolean(currentPlayerAnswer);
  const playerAnswerCorrect = currentPlayerAnswer?.correct ?? false;
  const playerAnswerIndex = currentPlayerAnswer?.optionIndex ?? null;
  const currentProgress = questions.length > 0 ? ((questionIndex + (feedbackVisible ? 1 : 0)) / questions.length) * 100 : 0;

  return <section className="mx-auto grid max-w-[950px] gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
    <div className="glass rounded-2xl p-4 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/[.07] pb-5">
        <div><p className="eyebrow mb-2">Knowledge challenge</p><h2 className="text-sm font-bold text-white">{phase === "ready" || phase === "loading" ? "Ten questions. One sharp mind." : `Question ${questionIndex + 1} / ${questions.length}`}</h2></div>
        {phase === "playing" && <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${timeRemaining <= 5 ? "bg-[#ff4058]/15 text-[#ff6879]" : "bg-[#ae69df]/10 text-[#c58cf0]"}`}><Clock3 size={14} /> {timeRemaining}s</div>}
      </div>

      {(phase === "ready" || phase === "loading") && <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
        <Trophy className="mb-5 text-[#ffb54c]" size={44} /><h2 className="text-3xl font-black text-white">QUICK QUIZ</h2><p className="section-copy mt-3 max-w-xs text-sm">Test your knowledge against the clock or a local AI opponent.</p>
        <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-2" role="group" aria-label="Quiz mode">
          <button type="button" disabled={phase === "loading"} aria-pressed={mode === "solo"} onClick={() => setMode("solo")} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${mode === "solo" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e]"}`}><Check size={14} /> Solo Quiz</button>
          <button type="button" disabled={phase === "loading"} aria-pressed={mode === "battle"} onClick={() => setMode("battle")} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${mode === "battle" ? "border-[#ff4058]/50 bg-[#ff4058]/10 text-[#ff6879]" : "border-white/[.08] bg-white/[.025] text-[#85818e]"}`}><Users size={14} /> AI Quiz Battle</button>
        </div>
        <div className="mt-6 w-full max-w-md"><p className="mb-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#85818e]">AI difficulty</p><AIDifficultySelector value={difficulty} onChange={setDifficulty} disabled={phase === "loading" || mode === "solo"} /></div>
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-[#85818e]"><span><strong className="text-white">10</strong> Questions</span><span><strong className="text-white">15s</strong> Time limit</span><span><strong className="text-white capitalize">{difficulty}</strong> Difficulty</span></div>
        {loadError && <p role="alert" className="mt-4 text-xs text-[#ff9ba8]">{loadError}</p>}
        <button type="button" disabled={phase === "loading"} onClick={() => void startQuiz()} className="accent-button mt-7 disabled:cursor-wait disabled:opacity-60">{phase === "loading" ? "Loading questions..." : mode === "battle" ? "Start AI Battle" : "Start Quiz"} <Sparkles size={15} /></button>
      </div>}

      {phase === "playing" && currentQuestion && <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="min-h-[390px]">
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/[.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${currentProgress}%` }} className="h-full bg-[#ff4058]" /></div>
        <div className="mb-8 flex items-center justify-between gap-3"><span className="rounded-md bg-[#ae69df]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#c58cf0]">{currentQuestion.category}</span><span className="text-[10px] uppercase tracking-[.12em] text-[#85818e]">{currentQuestion.difficulty}</span></div>
        <h2 className="max-w-[650px] text-2xl font-black leading-tight text-white sm:text-3xl">{currentQuestion.question}</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">{currentQuestion.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === currentQuestion.correctAnswer;
          const isSelected = optionIndex === playerAnswerIndex;
          const aiSelected = feedbackVisible && optionIndex === currentAiAnswer?.optionIndex;
          return <motion.button key={option} type="button" disabled={feedbackVisible || timeRemaining === 0} onClick={() => answerQuestion(optionIndex)} whileHover={!feedbackVisible ? { x: 4 } : undefined} whileTap={!feedbackVisible ? { scale: .98 } : undefined} aria-label={`Answer ${String.fromCharCode(65 + optionIndex)}: ${option}`} className={`flex min-h-14 items-center gap-3 rounded-xl border p-4 text-left text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff4058] disabled:cursor-not-allowed ${feedbackVisible && isCorrect ? "border-[#60dba2] bg-[#60dba2]/10 text-[#b8f5d4]" : feedbackVisible && isSelected ? "border-[#ff5368] bg-[#ff4058]/10 text-[#ff9ba8]" : aiSelected ? "border-[#ae69df] bg-[#ae69df]/10 text-[#d6b3f3]" : "border-white/[.08] bg-white/[.025] text-[#c9c5ce] hover:border-[#ff4058]/60 hover:bg-white/[.07]"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[.07] text-xs text-[#85818e]">{String.fromCharCode(65 + optionIndex)}</span><span className="flex-1">{option}</span>{feedbackVisible && isCorrect && <Check size={16} className="text-[#60dba2]" />}{feedbackVisible && isSelected && !isCorrect && <X size={16} className="text-[#ff5368]" />}{mode === "battle" && aiSelected && <Bot size={15} className="text-[#c58cf0]" />}</motion.button>;
        })}</div>
        {feedbackVisible && <p className={`mt-5 text-center text-xs font-bold ${playerAnswerCorrect ? "text-[#60dba2]" : "text-[#ffb54c]"}`}>{playerAnswerIndex === null ? "Time's up." : playerAnswerCorrect ? "Correct! +100 points" : "Not quite. The correct answer is highlighted."}</p>}
        {mode === "battle" && <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#c58cf0]" aria-live="polite">{aiThinking ? <><Bot size={14} className="animate-pulse" /> AI is thinking...</> : currentAiAnswer ? <><Bot size={14} /> AI answered in {(currentAiAnswer.responseTimeMs / 1000).toFixed(1)}s</> : null}</p>}
        {mode === "battle" && feedbackVisible && <p className="mt-2 text-center text-[10px] text-[#85818e]">Next question starts after both answers are in.</p>}
      </motion.div>}

      {phase === "complete" && <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[390px] flex-col items-center justify-center text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffb54c]/15 text-[#ffb54c]"><Trophy size={26} /></div><p className="eyebrow mb-3">All questions answered</p><h2 className="text-3xl font-black text-white">{resultTitle}</h2>
        <div className="mt-7 grid w-full max-w-[440px] grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-[#ff4058]/10 p-3"><div className="text-2xl font-black text-[#ff9ba8]">{playerScore}</div><div className="text-[10px] uppercase text-[#85818e]">Player score</div></div>
          <div className="rounded-lg bg-[#ae69df]/10 p-3"><div className="text-2xl font-black text-[#d6b3f3]">{mode === "battle" ? aiScore : "—"}</div><div className="text-[10px] uppercase text-[#85818e]">AI score</div></div>
          <div className="rounded-lg bg-white/[.04] p-3"><div className="text-xl font-black text-white">{accuracy}%</div><div className="text-[10px] uppercase text-[#85818e]">Player accuracy</div></div>
          <div className="rounded-lg bg-white/[.04] p-3"><div className="text-xl font-black text-white">{mode === "battle" ? `${aiAccuracy}%` : "—"}</div><div className="text-[10px] uppercase text-[#85818e]">AI accuracy</div></div>
          <div className="rounded-lg bg-white/[.04] p-3"><div className="text-lg font-black text-white">{playerAverageResponse} ms</div><div className="text-[10px] uppercase text-[#85818e]">Player avg response</div></div>
          <div className="rounded-lg bg-white/[.04] p-3"><div className="text-lg font-black text-white">{mode === "battle" ? `${(aiAverageResponse / 1000).toFixed(1)}s` : "—"}</div><div className="text-[10px] uppercase text-[#85818e]">AI avg response</div></div>
        </div>
        <p className="mt-6 flex items-center gap-2 text-lg font-black text-[#ffb54c]"><Sparkles size={18} />{reward ? `+${reward.xp_awarded} XP earned` : "XP syncing..."}</p><RewardStatus result={reward} loading={rewardLoading} error={rewardError} />
        <RewardStatus result={reward} loading={rewardLoading} error={rewardError} />
        <button type="button" onClick={() => void startQuiz()} className="accent-button mt-7"><RotateCcw size={15} /> Play Again</button><button type="button" onClick={returnToSetup} className="ghost-button mt-3">Change Mode</button>
      </motion.div>}
    </div>

    <aside className="space-y-4">
      <div className="glass grid grid-cols-2 gap-2 rounded-2xl p-4">
        <div className="rounded-lg bg-white/[.04] p-3"><Trophy size={14} className="mb-2 text-[#ffb54c]" /><div className="text-lg font-black text-white">{playerScore}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Player score</div></div>
        <div className="rounded-lg bg-[#ae69df]/10 p-3"><Bot size={14} className="mb-2 text-[#c58cf0]" /><div className="text-lg font-black text-white">{mode === "battle" ? aiScore : "—"}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">AI score</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><Check size={14} className="mb-2 text-[#60dba2]" /><div className="text-lg font-black text-white">{correctAnswers}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Player correct</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><X size={14} className="mb-2 text-[#ff5368]" /><div className="text-lg font-black text-white">{incorrectAnswers}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Player missed</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><Clock3 size={14} className="mb-2 text-[#ff5368]" /><div className="text-lg font-black text-white">{accuracy}%</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">Accuracy</div></div>
        <div className="rounded-lg bg-white/[.04] p-3"><Sparkles size={14} className="mb-2 text-[#ffb54c]" /><div className="text-lg font-black text-white">{phase === "complete" ? reward?.xp_awarded ?? localXp : "—"}</div><div className="text-[10px] uppercase tracking-wider text-[#85818e]">XP</div></div>
      </div>
      {phase === "playing" && <div className="glass rounded-2xl p-4"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#85818e]"><span>Progress</span><span>{questionIndex + 1} / {questions.length}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-[#ff4058] transition-all" style={{ width: `${currentProgress}%` }} /></div></div>}
      <div className="glass rounded-2xl p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-white"><Clock3 size={15} className="text-[#ff5368]" /> Quiz rules</div><p className="text-xs leading-6 text-[#85818e]">Answer each question within 15 seconds. In battle mode, the AI uses the same questions and waits before answering.</p></div>
      {phase === "playing" && <button type="button" onClick={returnToSetup} className="ghost-button w-full"><RotateCcw size={14} /> Restart Quiz</button>}
    </aside>

    {phase === "complete" && <div role="dialog" aria-modal="true" aria-label="Quick Quiz result" className="sr-only">{resultTitle}: player {playerScore}, AI {aiScore}</div>}
  </section>;
}
