import { Sparkles, TrendingUp } from "lucide-react";
import { getLevelProgress } from "@/lib/progression";

type XPProgressCardProps = { xp: number; level?: number; compact?: boolean };

export default function XPProgressCard({ xp, level, compact = false }: XPProgressCardProps) {
  const progress = getLevelProgress(xp);
  return <section className="glass rounded-xl p-5 sm:p-6" aria-label="XP progression">
    <div className="flex items-start justify-between gap-3">
      <div><p className="eyebrow mb-2">Player progression</p><h2 className="text-2xl font-black text-white">Level {level ?? progress.level}</h2></div>
      <Sparkles className="mt-1 text-[#ffb54c]" size={20} aria-hidden="true" />
    </div>
    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[.08]" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percent)}>
      <div className="h-full rounded-full bg-gradient-to-r from-[#ff4058] to-[#ffb54c] transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="font-bold text-white">{xp.toLocaleString()} XP total</span>
      <span className="text-[#aaa7b3]">{progress.xpIntoLevel.toLocaleString()} / {(progress.nextLevelXp - progress.currentLevelXp).toLocaleString()} XP</span>
    </div>
    {!compact && <p className="mt-3 flex items-center gap-2 text-[11px] text-[#85818e]"><TrendingUp size={13} className="text-[#60dba2]" />{progress.xpToNextLevel.toLocaleString()} XP to next level</p>}
  </section>;
}
