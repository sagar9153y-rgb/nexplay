import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactionRush from "@/components/games/ReactionRush";

export default function ReactionRushPage() {
  return <main className="min-h-screen bg-[#08080b] pb-24 pt-28"><div className="container-wide"><Link href="/games" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#85818e] transition hover:text-white"><ArrowLeft size={14} /> Back to Games</Link><div className="mb-12 text-center"><div className="eyebrow mb-4">Game 03 · Arcade</div><h1 className="text-[clamp(40px,7vw,70px)] font-black leading-[.9] tracking-[-.06em]">REACTION <span className="text-[#ff4058]">RUSH</span></h1><p className="section-copy mx-auto mt-5 max-w-[450px] text-sm">How fast can you react?</p></div><ReactionRush /></div></main>;
}