import { Award, Bot, Brain, Crown, Flame, Gamepad2, Layers3, Sparkles, Trophy, Zap } from "lucide-react";
import type { AchievementProgress } from "@/lib/progression-data";

const icons = { award: Award, bot: Bot, brain: Brain, crown: Crown, flame: Flame, gamepad: Gamepad2, layers: Layers3, sparkles: Sparkles, trophy: Trophy, zap: Zap } as const;

type AchievementCardProps = { achievement: AchievementProgress; compact?: boolean };

export default function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const Icon = icons[achievement.icon as keyof typeof icons] ?? Award;
  const unlocked = Boolean(achievement.unlocked_at);
  return <article className={`rounded-xl border p-4 ${unlocked ? "border-[#ffb54c]/20 bg-[#ffb54c]/[.06]" : "border-white/[.07] bg-white/[.025] opacity-70"}`}>
    <div className="flex items-start gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${unlocked ? "bg-[#ffb54c]/15 text-[#ffb54c]" : "bg-white/[.06] text-[#777482]"}`}><Icon size={18} aria-hidden="true" /></span>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-white">{achievement.name}</h3><span className={`text-[9px] font-bold uppercase tracking-wider ${unlocked ? "text-[#60dba2]" : "text-[#777482]"}`}>{unlocked ? "Unlocked" : "Locked"}</span></div><p className="mt-1 text-xs leading-5 text-[#85818e]">{achievement.description}</p>{!compact && achievement.unlocked_at && <time className="mt-2 block text-[10px] text-[#777482]" dateTime={achievement.unlocked_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(achievement.unlocked_at))}</time>}</div>
    </div>
  </article>;
}
