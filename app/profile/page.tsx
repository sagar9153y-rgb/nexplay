import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Gamepad2, Medal, Trophy, UserRound } from "lucide-react";
import AchievementCard from "@/components/progression/AchievementCard";
import GameHistoryList from "@/components/progression/GameHistoryList";
import StreakCard from "@/components/progression/StreakCard";
import XPProgressCard from "@/components/progression/XPProgressCard";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { getProgressionSnapshot, withProgressionTimeout } from "@/lib/progression-data";

type LegacyProfile = { username: string; avatar_url: string | null; xp: number; level: number; games_played: number; created_at: string };

function Stat({ label, value, tone = "text-white" }: { label: string; value: string | number; tone?: string }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-4"><p className={`text-2xl font-black ${tone}`}>{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">{label}</p></div>;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let snapshot;
  let unavailable = false;
  try {
    snapshot = await getProgressionSnapshot(supabase);
  } catch {
    unavailable = true;
    let profile: LegacyProfile | null = null;
    try {
      const { data } = await withProgressionTimeout(supabase.from("profiles").select("username, avatar_url, xp, level, games_played, created_at").eq("id", user.id).maybeSingle());
      profile = data as LegacyProfile | null;
    } catch {
      profile = null;
    }
    const fallbackName = typeof user.user_metadata.username === "string" ? user.user_metadata.username : user.email?.split("@")[0] ?? "Player";
    snapshot = {
      migrationPending: false,
      profile: { username: profile?.username ?? fallbackName, avatar_url: profile?.avatar_url ?? null, xp: profile?.xp ?? 0, level: profile?.level ?? 1, games_played: profile?.games_played ?? 0, created_at: profile?.created_at ?? new Date().toISOString() },
      stats: { games_played: profile?.games_played ?? 0, history_games: 0, wins: 0, losses: 0, draws: 0, win_rate: 0, global_rank: null },
      streak: { current: 0, best: 0, last_active_date: null },
      recent_games: [], achievements: [], recent_achievements: [], leaderboard_preview: [],
    };
  }
  const memberSince = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(snapshot.profile.created_at));
  return <main className="min-h-screen bg-[#08080b] pb-24 pt-28"><div className="container-wide max-w-[1000px]">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/[.07] pb-7"><div><p className="eyebrow mb-3">Your player profile</p><h1 className="text-4xl font-black text-white sm:text-5xl">WELCOME, <span className="text-[#ff4058]">{snapshot.profile.username.toUpperCase()}</span></h1><p className="mt-3 text-sm text-[#85818e]">Your profile, performance, and NEXPLAY record.</p></div><LogoutButton /></header>
    {unavailable && <div role="alert" className="mb-5 rounded-xl border border-[#ff4058]/25 bg-[#ff4058]/[.06] px-4 py-3 text-xs text-[#ffb0ba]">Some progression details are temporarily unavailable. Your saved XP and account are safe.</div>}
    {snapshot.migrationPending && <div role="status" className="mb-5 rounded-xl border border-[#ffb54c]/25 bg-[#ffb54c]/[.06] px-4 py-3 text-xs leading-5 text-[#ffcf7b]">Run <span className="font-bold">sql/schema.sql</span>, <span className="font-bold">sql/progression.sql</span>, and <span className="font-bold">sql/progression-platform.sql</span> in that order in Supabase to enable history, achievements, streaks, and rank.</div>}

    <section className="glass rounded-xl p-5 sm:p-6"><div className="flex flex-wrap items-center gap-4 border-b border-white/[.07] pb-5"><span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ff4058]/15 text-[#ff5368]">{snapshot.profile.avatar_url ? <span className="h-full w-full bg-cover bg-center" role="img" aria-label={`${snapshot.profile.username} avatar`} style={{ backgroundImage: `url(${snapshot.profile.avatar_url})` }} /> : <UserRound size={26} />}</span><div className="min-w-0 flex-1"><h2 className="truncate text-xl font-black text-white">{snapshot.profile.username}</h2><p className="mt-1 text-xs text-[#85818e]">{user.email}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-[#777482]">Member since {memberSince}</p></div><div className="flex flex-wrap gap-2"><Link href="/dashboard" className="ghost-button !px-3 !py-2 text-xs">Dashboard</Link><Link href="/games" className="accent-button !px-3 !py-2 text-xs">Play Games <ArrowRight size={13} /></Link></div></div><div className="mt-5"><XPProgressCard xp={snapshot.profile.xp} level={snapshot.profile.level} compact /></div></section>

    <section className="mt-6"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Trophy size={16} className="text-[#ffb54c]" /> Performance</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Games played" value={snapshot.stats.games_played} /><Stat label="Wins" value={snapshot.stats.wins} tone="text-[#60dba2]" /><Stat label="Losses" value={snapshot.stats.losses} tone="text-[#ff6879]" /><Stat label="Draws" value={snapshot.stats.draws} /><Stat label="Win rate" value={`${snapshot.stats.win_rate}%`} tone="text-[#ffb54c]" /><Stat label="Global rank" value={snapshot.stats.global_rank ? `#${snapshot.stats.global_rank}` : "—"} tone="text-[#d6b3f3]" /><div className="col-span-2"><StreakCard streak={snapshot.streak} /></div></div></section>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="glass rounded-xl p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-bold text-white"><Gamepad2 size={16} className="text-[#ff5368]" /> Recent Games</h2><span className="text-[10px] text-[#777482]">Last 8 results</span></div><GameHistoryList games={snapshot.recent_games} /></section>
      <section className="glass rounded-xl p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-bold text-white"><Medal size={16} className="text-[#ffb54c]" /> Recent Achievements</h2><Link href="/achievements" className="text-[11px] font-bold text-[#aaa7b3] hover:text-white">View all</Link></div>{snapshot.recent_achievements.length === 0 ? <p className="rounded-lg bg-white/[.025] p-4 text-xs leading-5 text-[#85818e]">No achievements unlocked yet. Keep playing to reach your first milestone.</p> : <div className="grid gap-3">{snapshot.recent_achievements.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} compact />)}</div>}</section></div>
  </div></main>;
}
