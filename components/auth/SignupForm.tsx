"use client";

import Link from "next/link";
import { Check, Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { username: normalizedUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        const message = authError.message;
        if (/already|registered|exists/i.test(message)) {
          setError("An account with this email already exists.");
        } else if (/database error|saving new user/i.test(message)) {
          setError(`Supabase could not create the profile (${message}). Verify that sql/schema.sql is installed and try a different username if it is already taken.`);
        } else {
          setError(message || "Unable to create your account right now. Please try again.");
        }
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setSuccess("Account created. Check your email to confirm your account, then log in.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error
        ? caughtError.message
        : "Unable to create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#c9c5ce]">Username</span>
      <input required minLength={3} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="h-11 w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 text-sm text-white outline-none transition focus:border-[#ff4058]" placeholder="Your gamer tag" />
    </label>
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#c9c5ce]">Email</span>
      <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="h-11 w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 text-sm text-white outline-none transition focus:border-[#ff4058]" placeholder="you@example.com" />
    </label>
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#c9c5ce]">Password</span>
      <span className="relative block">
        <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="h-11 w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 pr-12 text-sm text-white outline-none transition focus:border-[#ff4058]" placeholder="At least 8 characters" />
        <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#777482] hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </span>
    </label>
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#c9c5ce]">Confirm Password</span>
      <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="h-11 w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 text-sm text-white outline-none transition focus:border-[#ff4058]" placeholder="Repeat your password" />
    </label>
    {error && <p role="alert" className="rounded-lg border border-[#ff4058]/30 bg-[#ff4058]/10 px-3 py-2 text-xs text-[#ff9ba8]">{error}</p>}
    {success && <p role="status" className="rounded-lg border border-[#60dba2]/30 bg-[#60dba2]/10 px-3 py-2 text-xs text-[#b8f5d4]">{success}</p>}
    <button disabled={loading} className="accent-button w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={16} /> : <UserPlus size={16} />}{loading ? "Creating account..." : "Create Account"}</button>
    <p className="text-center text-xs text-[#85818e]">Already have an account? <Link href="/login" className="font-bold text-[#ff6879] hover:text-white">Login</Link></p>
    <p className="flex items-center justify-center gap-1 text-center text-[10px] text-[#605d68]"><Check size={12} /> Free to play. Progress is tracked with virtual XP.</p>
  </form>;
}
