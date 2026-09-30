import { ArrowUpRight, Bot, Clock3, Gamepad2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { GameHistoryEntry } from "@/lib/progression-data";

const gameNames: Record<GameHistoryEntry["game_type"], string> = {
  "tic-tac-toe": "Tic Tac Toe",
  "memory-match": "Memory Match",
  "reaction-rush": "Reaction Rush",
  "quick-quiz": "Quick Quiz",
};

function resultLabel(result: GameHistoryEntry["result"]) {
  if (result === "complete") return "Completed";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

type GameHistoryListProps = { games: GameHistoryEntry[]; limit?: number };

export default function GameHistoryList({ games, limit }: GameHistoryListProps) {
  const entries = limit ? games.slice(0, limit) : games;
  if (entries.length === 0) return <div className="rounded-xl border border-dashed border-white/[.1] px-4 py-10 text-center"><Gamepad2 className="mx-auto mb-3 text-[#777482]" size={22} /><p className="text-sm font-bold text-white">No games recorded yet</p><p className="mt-1 text-xs text-[#85818e]">Your completed games will appear here.</p><Link href="/games" className="accent-button mt-5 inline-flex">Browse Games <ArrowUpRight size={14} /></Link></div>;
  return <ul className="divide-y divide-white/[.07]">{entries.map((game) => <li key={game.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{gameNames[game.game_type]}</h3><p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#85818e]"><span>{game.game_mode.replaceAll("-", " ")}</span>{game.ai_difficulty && <span className="inline-flex items-center gap-1"><Bot size={11} />{game.ai_difficulty}</span>}<time dateTime={game.played_at} className="inline-flex items-center gap-1"><Clock3 size={11} />{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(game.played_at))}</time></p></div><div className="flex items-center gap-3 text-right"><span className={`text-[10px] font-bold ${game.result === "win" ? "text-[#60dba2]" : game.result === "loss" ? "text-[#ff6879]" : "text-[#aaa7b3]"}`}>{resultLabel(game.result)}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-[#ffb54c]"><Sparkles size={12} />+{game.xp_awarded}</span></div></li>)}</ul>;
}
