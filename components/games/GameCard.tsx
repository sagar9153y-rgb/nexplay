"use client";

import { ArrowRight, Bot, Gamepad2, LucideIcon, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export type GameCategory = "Quick Games" | "Puzzle" | "Arcade" | "Quiz";
export type Difficulty = "Easy" | "Medium" | "Hard";

export type Game = {
  id: string;
  title: string;
  category: GameCategory;
  difficulty: Difficulty;
  players: number;
  xpReward: number;
  description: string;
  aiBadge: string;
  Icon: LucideIcon;
};

type GameCardProps = { game: Game; index: number };

export default function GameCard({ game, index }: GameCardProps) {
  const isPlayable = game.id === "tic-tac-toe" || game.id === "memory-match" || game.id === "reaction-rush" || game.id === "quick-quiz";
  const href = game.id === "tic-tac-toe" ? "/games/tic-tac-toe" : game.id === "memory-match" ? "/games/memory-match" : game.id === "reaction-rush" ? "/games/reaction-rush" : "/games/quick-quiz";
  return <motion.article layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }} transition={{ duration: .25, delay: index * .06 }} className="glass group flex h-full flex-col rounded-2xl p-4">
    <div className="relative mb-5 flex aspect-[1.2] items-center justify-center overflow-hidden rounded-xl border border-white/[.06] bg-[radial-gradient(circle_at_center,rgba(255,64,88,.18),transparent_65%)]"><div className="absolute h-36 w-36 rounded-full border border-[#ff4058]/15 transition duration-500 group-hover:scale-125" /><game.Icon className="relative text-[#ff6175] transition duration-300 group-hover:scale-110" size={68} strokeWidth={1.1} /><span className="absolute right-3 top-3 rounded-full border border-white/[.1] bg-black/20 px-2 py-1 text-[10px] font-bold text-[#c9c5ce]">{game.difficulty}</span></div>
      <div className="flex items-start justify-between gap-3"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#ff5368]">{game.category}</p><h2 className="text-lg font-black tracking-tight text-white">{game.title}</h2><span className="mt-2 inline-flex items-center gap-1 rounded-md border border-[#ae69df]/20 bg-[#ae69df]/10 px-2 py-1 text-[9px] font-bold text-[#d6b3f3]"><Bot size={11} aria-hidden="true" />{game.aiBadge}</span></div><span className="flex shrink-0 items-center gap-1 rounded-md bg-[#ffb54c]/10 px-2 py-1 text-[10px] font-bold text-[#ffb54c]"><Sparkles size={11} /> {game.xpReward} XP</span></div>
    <p className="mt-3 flex-1 text-xs leading-6 text-[#85818e]">{game.description}</p><div className="mt-5 flex items-center justify-between border-t border-white/[.07] pt-4 text-[11px] text-[#85818e]"><span className="flex items-center gap-1.5"><Gamepad2 size={14} /> {game.players} {game.players === 1 ? "player" : "players"}</span><span>{game.difficulty} difficulty</span></div>
    {isPlayable ? <Link href={href} className="accent-button mt-4 w-full rounded-lg py-3 text-xs"><span>Play Now</span> <ArrowRight size={14} /></Link> : <span aria-disabled="true" className="mt-4 flex cursor-default items-center justify-center gap-2 rounded-lg border border-white/[.1] py-3 text-xs font-black text-[#777482]">Coming Soon <Play size={12} /></span>}
  </motion.article>;
}