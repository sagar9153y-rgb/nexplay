"use client";

import Link from "next/link";
import { Brain, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";

const challenges = [
  { name: "Play 3 Games", detail: "Complete any three games today.", goal: "3 games", xp: "+50 XP", Icon: Target },
  { name: "Win a Game", detail: "Win any game today.", goal: "1 win", xp: "+75 XP", Icon: Flame },
  { name: "Quiz Time", detail: "Complete a Quick Quiz today.", goal: "1 quiz", xp: "+50 XP", Icon: Brain },
];

export default function Challenges() {
  return (
    <section id="challenges" className="border-y border-white/[.06] bg-[#0d0b11] py-24">
      <div className="container-wide grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <div className="eyebrow mb-4">Keep your streak alive</div>
          <h2 className="section-heading">A little daily<br /><span className="text-[#ff4058]">competition</span> goes a long way.</h2>
          <p className="section-copy mt-6 max-w-[390px]">Fresh challenges every day. Stack your XP, unlock achievements, and build momentum one round at a time.</p>
          <Link href="/dashboard" className="ghost-button mt-8">See your challenges</Link>
        </div>
        <div className="grid gap-3">
          {challenges.map((challenge, index) => (
            <motion.article
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * .1 }}
              key={challenge.name}
              className="glass flex items-center gap-4 rounded-lg p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ff4058]/10 text-[#ff4058]">
                <challenge.Icon size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{challenge.name}</h3>
                    <p className="mt-1 text-[11px] text-[#777482]">{challenge.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#ffb54c]">{challenge.xp}</span>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">Daily goal: {challenge.goal}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
