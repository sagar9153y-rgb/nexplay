"use client";

import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    setLoading(true);
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message.toLowerCase().includes("invalid") ? "Email or password is incorrect." : "Unable to sign in right now. Please try again."); return; }
    router.push("/profile"); router.refresh();
  }

  return <form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-[#c9c5ce]">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="h-12 w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 text-sm text-white outline-none transition placeholder:text-[#777482] focus:border-[#ff4058]" placeholder="you@example.com" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-[#c9c5ce]">Password</span><span className="relative block"><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-12 w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 pr-12 text-sm text-white outline-none transition focus:border-[#ff4058]" placeholder="Your password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#777482] hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>{error && <p role="alert" className="rounded-lg border border-[#ff4058]/30 bg-[#ff4058]/10 px-3 py-2 text-xs text-[#ff9ba8]">{error}</p>}<button disabled={loading} className="accent-button w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={16} /> : <LogIn size={16} />}{loading ? "Signing in..." : "Login"}</button><p className="text-center text-xs text-[#85818e]">Don&apos;t have an account? <Link href="/signup" className="font-bold text-[#ff6879] hover:text-white">Create Account</Link></p></form>;
}