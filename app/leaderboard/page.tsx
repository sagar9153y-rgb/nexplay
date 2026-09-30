import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGlobalLeaderboard, type LeaderboardEntry } from "@/lib/progression-data";

export default async function LeaderboardPage() {
  let players: LeaderboardEntry[];
  let unavailable = false;
  try {
    const supabase = await createClient();
    players = await getGlobalLeaderboard(supabase);
  } catch {
    players = [];
    unavailable = true;
  }

  return <main className="min-h-screen bg-[#08080b] pb-24 pt-28"><div className="container-wide max-w-[900px]">
    <header className="mb-8 border-b border-white/[.07] pb-7"><p className="eyebrow mb-3">Global standings · All time</p><h1 className="text-4xl font-black text-white sm:text-5xl">THE <span className="text-[#ff4058]">LEADERBOARD</span></h1><p className="mt-3 text-sm text-[#85818e]">Ranked by persistent virtual XP.</p></header>
    {unavailable && <div role="alert" className="mb-5 rounded-xl border border-[#ff4058]/25 bg-[#ff4058]/[.06] p-4 text-xs text-[#ffb0ba]">Leaderboard data is temporarily unavailable. Run the progression migration if it has not been applied, then retry.</div>}
    <section className="glass overflow-hidden rounded-xl"><div className="grid grid-cols-[48px_minmax(0,1fr)_72px_100px] gap-3 border-b border-white/[.08] bg-white/[.025] px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#85818e] sm:grid-cols-[64px_minmax(0,1fr)_100px_140px]"><span>Rank</span><span>Player</span><span className="text-right">Level</span><span className="text-right">XP</span></div>
      {players.length === 0 ? <div className="px-5 py-16 text-center"><p className="text-sm font-bold text-white">No leaderboard entries yet</p><p className="mt-2 text-xs text-[#85818e]">Earn XP by completing a game to appear here.</p><Link href="/games" className="accent-button mt-5 inline-flex">Play a Game</Link></div> : <ol>{players.map((player) => <li key={`${player.rank}-${player.username}`} className={`grid grid-cols-[48px_minmax(0,1fr)_72px_100px] items-center gap-3 border-b border-white/[.05] px-4 py-3 last:border-0 sm:grid-cols-[64px_minmax(0,1fr)_100px_140px] ${player.is_current_user ? "bg-[#ff4058]/[.07]" : ""}`}>
        <span className={`text-sm font-black ${player.rank <= 3 ? "text-[#ffb54c]" : "text-[#85818e]"}`}>#{player.rank}</span><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[.06] text-xs font-bold text-[#aaa7b3]">{player.avatar_url ? <span className="h-full w-full bg-cover bg-center" role="img" aria-label={`${player.username} avatar`} style={{ backgroundImage: `url(${player.avatar_url})` }} /> : player.username.slice(0, 1).toUpperCase()}</span><span className="truncate text-xs font-bold text-white">{player.username}{player.is_current_user && <span className="ml-2 text-[9px] uppercase text-[#ff6879]">You</span>}</span></div><span className="text-right text-xs text-[#c9c5ce]">{player.level}</span><span className="text-right text-xs font-black text-[#ffb54c]">{player.xp.toLocaleString()}</span>
      </li>)}</ol>}
    </section><p className="mt-4 text-[10px] text-[#777482]">Only public player name, avatar, level, XP, and rank are shown.</p>
  </div></main>;
}
