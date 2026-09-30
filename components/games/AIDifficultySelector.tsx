"use client";

import { AI_DIFFICULTIES, type AIDifficulty } from "@/lib/ai/types";

type AIDifficultySelectorProps = {
  value: AIDifficulty;
  onChange: (difficulty: AIDifficulty) => void;
  disabled?: boolean;
};

export default function AIDifficultySelector({ value, onChange, disabled = false }: AIDifficultySelectorProps) {
  return <div className="grid grid-cols-3 gap-2" role="group" aria-label="AI difficulty">
    {AI_DIFFICULTIES.map((difficulty) => <button
      key={difficulty}
      type="button"
      disabled={disabled}
      aria-pressed={value === difficulty}
      onClick={() => onChange(difficulty)}
      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-bold capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff4058] disabled:cursor-not-allowed disabled:opacity-40 ${value === difficulty ? "border-[#ae69df]/60 bg-[#ae69df]/10 text-[#cf9cf2]" : "border-white/[.08] bg-white/[.025] text-[#85818e] hover:border-white/20"}`}
    >{difficulty}</button>)}
  </div>;
}
