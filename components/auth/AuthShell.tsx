import Link from "next/link";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = { children: ReactNode; eyebrow: string; title: string; subtitle: string };

export default function AuthShell({ children, eyebrow, title, subtitle }: AuthShellProps) {
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080b] px-4 py-12"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,rgba(107,38,132,.2),transparent_45%),radial-gradient(ellipse_at_10%_90%,rgba(172,25,50,.12),transparent_45%)]" /><div className="relative w-full max-w-[440px]"><Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-sm font-black tracking-[.12em]"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ff4058] text-white"><Zap size={16} fill="currentColor" /></span>NEXPLAY</Link><div className="glass rounded-2xl p-6 sm:p-8"><div className="mb-7 text-center"><div className="eyebrow mb-4">{eyebrow}</div><h1 className="text-3xl font-black tracking-tight text-white">{title}</h1><p className="section-copy mt-3 text-sm">{subtitle}</p></div>{children}</div></div></main>;
}