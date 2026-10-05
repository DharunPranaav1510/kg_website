import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies, currentTokens, forgetAdminSession, getAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";

// Sign out. With ?all=1, sign out of every device (revokes all sessions).
export async function POST(req: NextRequest) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const supabase = getSupabase();
  const tokens = await currentTokens();
  const admin = await getAdmin();

  if (supabase && tokens) {
    // Revoke on the server, so a copied cookie stops working too.
    const { error } = await supabase.auth.admin.signOut(tokens.access, all ? "global" : "local");
    if (error) console.error("Server-side sign out failed:", error.message);
  }
  if (tokens) forgetAdminSession(tokens.access);
  if (admin) await audit(all ? "logout_everywhere" : "logout", undefined, undefined, admin.email);

  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
