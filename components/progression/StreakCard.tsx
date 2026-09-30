import { Flame, Trophy } from "lucide-react";
import type { ProgressionStreak } from "@/lib/progression-data";

type StreakCardProps = { streak: ProgressionStreak };

export default function StreakCard({ streak }: StreakCardProps) {
  return <section className="glass rounded-xl p-5" aria-label="Daily play streak">
    <div className="mb-4 flex items-center gap-2 text-xs font-bold text-white"><Flame size={16} className="text-[#ff5368]" /> Daily Streak</div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-[#ff4058]/10 p-3"><p className="flex items-center gap-2 text-xl font-black text-[#ff9ba8]"><Flame size={16} />{streak.current}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">Current days</p></div>
      <div className="rounded-lg bg-[#ffb54c]/10 p-3"><p className="flex items-center gap-2 text-xl font-black text-[#ffcf7b]"><Trophy size={16} />{streak.best}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#85818e]">Best streak</p></div>
    </div>
  </section>;
}
