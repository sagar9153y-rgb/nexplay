"use client";

import { Brain, Clock3, Play, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";

const games = [
  { name: "Tic Tac Toe", href: "/games/tic-tac-toe", category: "Strategy", difficulty: "Easy", Icon: Target, color: "#ff4058" },
  { name: "Memory Match", href: "/games/memory-match", category: "Focus", difficulty: "Medium", Icon: Brain, color: "#9b5ce1" },
  { name: "Reaction Rush", href: "/games/reaction-rush", category: "Reflex", difficulty: "Hard", Icon: Clock3, color: "#ec9a42" },
  { name: "Quick Quiz", href: "/games/quick-quiz", category: "Knowledge", difficulty: "Medium", Icon: Sparkles, color: "#46b9d0" },
];

export default function FeaturedGames() {
  return (
    <section id="games" className="container-wide py-28">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="eyebrow mb-4">Pick your challenge</div>
          <h2 className="section-heading">Your next high score<br />starts here.</h2>
        </div>
        <a href="/games" className="ghost-button">View all games <Play size={14} /></a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game, index) => (
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * .07 }}
            key={game.name}
            className="glass group rounded-xl p-4 transition duration-300 hover:-translate-y-1 hover:border-white/20"
          >
            <div
              className="mb-5 flex aspect-[1.35] items-center justify-center overflow-hidden rounded-lg bg-white/[.035]"
              style={{ background: `radial-gradient(circle, ${game.color}22, transparent 68%)` }}
            >
              <game.Icon size={62} strokeWidth={1.1} style={{ color: game.color }} className="transition duration-300 group-hover:scale-110" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{game.name}</h3>
              <p className="mt-1 text-[11px] text-[#777482]">{game.category} · {game.difficulty}</p>
            </div>
            <a
              href={game.href}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-white/[.1] py-2.5 text-xs font-bold text-[#ddd9e2] transition hover:border-[#ff4058] hover:bg-[#ff4058] hover:text-white"
            >
              Play now <Play size={12} fill="currentColor" />
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
