"use client";

import { LogOut, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setLoading(true);
    setError("");
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login");
      router.refresh();
    } catch (caughtError) {
      console.error("Sign out failed:", caughtError);
      setError("Unable to log out right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div>
    <button type="button" onClick={() => void logout()} disabled={loading} className="ghost-button text-xs disabled:opacity-60">
      {loading ? <LoaderCircle className="animate-spin" size={14} /> : <LogOut size={14} />}
      {loading ? "Logging out..." : "Logout"}
    </button>
    {error && <p role="alert" className="mt-2 text-xs text-[#ff9ba8]">{error}</p>}
  </div>;
}