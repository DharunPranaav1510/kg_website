import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { decideAccess, decodeAal } from "@/lib/admin-access";
import {
  clearSessionCookies,
  refreshSession,
  requireMfa,
  setSessionCookies,
  verifiedTotpFactors,
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

  // A password-only session of an account with two-step login must sign in again.
  const aal = decodeAal(session.access_token);
  const hasFactor = aal === "aal2" || (await verifiedTotpFactors(session.user.id)).length > 0;
  if (decideAccess({ aal, hasVerifiedFactor: hasFactor, requireMfa: requireMfa() }) === "deny") return toLogin();

  const res = NextResponse.redirect(new URL("/admin", req.url));
  setSessionCookies(res, session);
  return res;
}
