import { ArrowLeft } from "lucide-react";
import TicTacToe from "@/components/games/TicTacToe";

export default function TicTacToePage() {
  return <main className="min-h-screen bg-[#08080b] pb-24 pt-28"><div className="container-wide"><a href="/games" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#85818e] transition hover:text-white"><ArrowLeft size={14} /> Back to Games</a><div className="mb-12 text-center"><div className="eyebrow mb-4">Game 01 · Strategy</div><h1 className="text-[clamp(40px,7vw,70px)] font-black leading-[.9] tracking-[-.06em]">TIC <span className="text-[#ff4058]">TAC</span> TOE</h1><p className="section-copy mx-auto mt-5 max-w-[450px] text-sm">Outsmart your opponent and claim the board.</p></div><TicTacToe /></div></main>;
}