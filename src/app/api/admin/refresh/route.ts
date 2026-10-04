import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/admin-auth";

// Visited when the short-lived access token has expired: swaps the refresh
// token for a new session, then returns to the admin page (or to login).
export async function GET(req: NextRequest) {
  const toLogin = () => {
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    clearSessionCookies(res);
    return res;
  };

  const session = await refreshSession();
  const email = session?.user.email?.toLowerCase();
  const supabase = getSupabase();
  if (!session || !email || !supabase) return toLogin();

  const { data: admin } = await supabase
    .from("admins")
    .select("email")
    .ilike("email", email)
    .maybeSingle();
  if (!admin) return toLogin();

  const res = NextResponse.redirect(new URL("/admin", req.url));
  setSessionCookies(res, session);
  return res;
}
