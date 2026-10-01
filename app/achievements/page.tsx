import Link from "next/link";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import AchievementCard from "@/components/progression/AchievementCard";
import { createClient } from "@/lib/supabase/server";
import { getProgressionSnapshot } from "@/lib/progression-data";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  let snapshot;
  try {
    snapshot = await getProgressionSnapshot(supabase);
  } catch {
    return <main className="min-h-screen bg-[#08080b] pb-24 pt-28"><div className="container-wide max-w-[1000px]"><p className="eyebrow mb-3">Milestones</p><h1 className="text-4xl font-black text-white">ACHIEVEMENTS</h1><div role="alert" className="glass mt-6 rounded-xl border border-[#ff4058]/20 p-5 text-sm text-[#ffb0ba]">Achievement progress is temporarily unavailable. Try again after the progression service is restored.</div></div></main>;
  }
  const unlockedCount = snapshot.achievements.filter((achievement) => achievement.unlocked_at).length;
  return <main className="min-h-screen bg-[#08080b] pb-24 pt-28"><div className="container-wide max-w-[1000px]">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[.07] pb-7"><div><p className="eyebrow mb-3">Milestones</p><h1 className="text-4xl font-black text-white sm:text-5xl">ACHIEVE <span className="text-[#ff4058]">MORE</span></h1><p className="mt-3 text-sm text-[#85818e]">Milestones unlock automatically as you play.</p></div><p className="flex items-center gap-2 text-xs font-bold text-[#ffb54c]"><Award size={16} />{unlockedCount} / {snapshot.achievements.length} unlocked</p></header>
    {snapshot.migrationPending && <div role="status" className="mb-5 rounded-xl border border-[#ffb54c]/25 bg-[#ffb54c]/[.06] px-4 py-3 text-xs leading-5 text-[#ffcf7b]">Run <span className="font-bold">sql/schema.sql</span>, <span className="font-bold">sql/progression.sql</span>, and <span className="font-bold">sql/progression-platform.sql</span> in that order in Supabase to enable automatic unlock tracking.</div>}
    {snapshot.achievements.length === 0 ? <div className="glass rounded-xl p-10 text-center"><p className="text-sm font-bold text-white">Achievement definitions unavailable</p><p className="mt-2 text-xs text-[#85818e]">Retry once progression data is available.</p><Link href="/dashboard" className="ghost-button mt-5 inline-flex">Back to Dashboard</Link></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{snapshot.achievements.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)}</div>}
  </div></main>;
}
