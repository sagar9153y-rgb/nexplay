import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    console.error("Supabase auth callback failed:", error?.message ?? "No session returned.");
    return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
  }

  return NextResponse.redirect(new URL("/dashboard", url.origin));
}