"use client";

import { LogOut, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() { const router = useRouter(); const [loading, setLoading] = useState(false); async function logout() { setLoading(true); await createClient().auth.signOut(); router.replace("/login"); router.refresh(); } return <button type="button" onClick={logout} disabled={loading} className="ghost-button text-xs disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={14} /> : <LogOut size={14} />} {loading ? "Logging out..." : "Logout"}</button>; }