"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/progression-data";

export default function LeaderboardPreview() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const { data, error } = await createClient().rpc("get_global_leaderboard", { p_limit: 5 });
        if (error) throw error;
        if (active) setPlayers((data ?? []) as LeaderboardEntry[]);
      } catch (error) {
        console.error("Leaderboard preview load failed:", error);
        if (active) setUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="leaderboard" className="container-wide py-28">
      <div className="grid gap-14 lg:grid-cols-[1fr_500px] lg:items-center">
        <div>
          <div className="eyebrow mb-4">The leaderboard</div>
          <h2 className="section-heading">Climb the ranks.<br />Own your <span className="text-[#ff4058]">legacy.</span></h2>
          <p className="section-copy mt-6 max-w-[390px]">Every win, streak, and challenge pushes you higher. See how you stack up against the best players in the arena.</p>
          <a href="/leaderboard" className="ghost-button mt-8">View leaderboard <ArrowUpRight size={14} /></a>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between border-b border-white/[.08] px-3 pb-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold"><Crown size={15} className="text-[#ffb54c]" /> All-time leaders</div>
            <span className="text-[10px] uppercase tracking-wider text-[#777482]">Top players</span>
          </div>
          {loading ? (
            <p role="status" className="px-3 py-8 text-center text-xs text-[#85818e]">Loading leaderboard...</p>
          ) : unavailable ? (
            <p role="alert" className="px-3 py-8 text-center text-xs text-[#ff9ba8]">Leaderboard is temporarily unavailable.</p>
          ) : players.length === 0 ? (
            <p role="status" className="px-3 py-8 text-center text-xs text-[#85818e]">No players on the leaderboard yet.</p>
          ) : (
            players.map((player, index) => (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * .06 }}
                key={`${player.rank}-${player.username}`}
                className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-white/[.04]"
              >
                <span className={`w-5 text-center text-xs font-black ${player.rank === 1 ? "text-[#ffb54c]" : "text-[#777482]"}`}>{player.rank}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff4058]/15 text-[10px] font-black text-white">
                  {player.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-xs font-bold text-white">
                  {player.username}
                  {player.is_current_user && <span className="ml-2 text-[9px] uppercase text-[#ff6879]">You</span>}
                </span>
                <span className="text-[10px] text-[#777482]">Lvl {player.level}</span>
                <span className="w-16 text-right text-xs font-bold text-[#e4e0e8]">
                  {player.xp.toLocaleString()} <span className="text-[9px] font-normal text-[#777482]">XP</span>
                </span>
                {player.rank <= 3 && <Medal size={13} className={player.rank === 1 ? "text-[#ffb54c]" : "text-[#a5a1ad]"} />}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
