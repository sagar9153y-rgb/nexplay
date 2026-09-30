"use client";

import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const publicLinks = [{ label: "Home", href: "/" }, { label: "Games", href: "/games" }, { label: "Leaderboard", href: "/leaderboard" }];
const memberLinks = [{ label: "Dashboard", href: "/dashboard" }, { label: "Achievements", href: "/achievements" }, { label: "Profile", href: "/profile" }];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setIsAuthenticated(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setIsAuthenticated(Boolean(session?.user)));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    setIsAuthenticated(false);
    setOpen(false);
  }

  const links = isAuthenticated ? [...publicLinks, ...memberLinks] : publicLinks;
  return <header className="absolute left-0 right-0 top-0 z-20 border-b border-white/[.06]">
    <div className="container-wide flex h-[74px] items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-sm font-black tracking-[.12em]" aria-label="NEXPLAY home"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ff4058] text-white"><Zap size={16} fill="currentColor" /></span>NEXPLAY</Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">{links.map((link) => <Link key={link.href} href={link.href} className="text-xs font-semibold text-[#aaa7b3] transition hover:text-white">{link.label}</Link>)}</nav>
      <div className="hidden items-center gap-5 md:flex">{isAuthenticated ? <button type="button" onClick={() => void logout()} className="text-xs font-semibold text-[#aaa7b3] hover:text-white">Logout</button> : <><Link href="/login" className="text-xs font-semibold text-[#aaa7b3] hover:text-white">Login</Link><Link href="/signup" className="accent-button !px-4 !py-2.5">Create Account</Link></>}</div>
      <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-11 min-w-11 items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff4058] md:hidden">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav aria-label="Mobile navigation" className="border-t border-white/[.06] bg-[#0c0b10]/95 px-5 py-4 backdrop-blur-xl md:hidden"><div className="container-wide grid gap-1">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#c9c5ce] hover:bg-white/[.05] hover:text-white">{link.label}</Link>)}{isAuthenticated ? <button type="button" onClick={() => void logout()} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#c9c5ce] hover:bg-white/[.05] hover:text-white">Logout</button> : <div className="mt-2 flex gap-3 border-t border-white/[.06] pt-4"><Link href="/login" onClick={() => setOpen(false)} className="ghost-button flex-1 justify-center">Login</Link><Link href="/signup" onClick={() => setOpen(false)} className="accent-button flex-1 justify-center">Create Account</Link></div>}</div></nav>}
  </header>;
}
