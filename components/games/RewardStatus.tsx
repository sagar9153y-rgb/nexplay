"use client";

import { Award, Check, LoaderCircle, Sparkles, TrendingUp } from "lucide-react";
import { calculateLevel } from "@/lib/progression";
import type { CompletedGameResult } from "@/lib/progression-client";

type RewardStatusProps = { result: CompletedGameResult | null; loading: boolean; error: string | null; onRetry?: () => void };

export default function RewardStatus({ result, loading, error, onRetry }: RewardStatusProps) {
  if (loading) return <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#85818e]"><LoaderCircle className="animate-spin" size={14} /> Saving your XP...</p>;
  if (error) return <div role="alert" className="mt-4 rounded-lg border border-[#ff4058]/30 bg-[#ff4058]/10 px-3 py-3 text-xs text-[#ffb0ba]"><p>{error}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-3 rounded-md border border-[#ff4058]/30 px-3 py-2 font-bold text-white transition hover:bg-[#ff4058]/15">Retry XP sync</button>}</div>;
  if (!result) return null;
  const leveledUp = result.xp_awarded > 0 && calculateLevel(result.total_xp - result.xp_awarded) < result.level;
  return <div className="mt-4 space-y-2"><p className="flex items-center justify-center gap-1 text-sm font-black text-[#ffb54c]"><Sparkles size={15} /> +{result.xp_awarded} XP {result.already_awarded && <span className="text-[10px] font-normal text-[#85818e]">already claimed</span>}</p><p className="flex items-center justify-center gap-3 text-[11px] text-[#85818e]"><span className="flex items-center gap-1"><Check size={12} className="text-[#60dba2]" /> {result.total_xp} total XP</span><span className="flex items-center gap-1"><TrendingUp size={12} className="text-[#ae69df]" /> Level {result.level}</span><span>{result.games_played} games</span></p>{leveledUp && <p className="text-xs font-bold text-[#60dba2]">Level up! You reached level {result.level}.</p>}{Boolean(result.new_achievements?.length) && <div role="status" aria-live="polite" className="rounded-lg border border-[#ffb54c]/25 bg-[#ffb54c]/[.06] px-3 py-2 text-left"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#ffcf7b]"><Award size={13} />Achievement unlocked</p>{result.new_achievements?.map((achievement) => <p key={achievement.id} className="mt-1 text-xs font-bold text-white">{achievement.name}</p>)}</div>}</div>;
}