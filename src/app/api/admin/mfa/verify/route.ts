import { NextRequest, NextResponse } from "next/server";
import { currentTokens, requireAdmin, setSessionCookies } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { clientIpHash } from "@/lib/guard";
import { record, underLimit } from "@/lib/ratelimit";
import { getSupabase, getUserClient } from "@/lib/supabase";

// Finish setting up two-step login by entering the first code.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin({ allowMfaSetup: true });
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const factorId = typeof body?.factorId === "string" ? body.factorId : "";
  const code = String(body?.code ?? "").replace(/\s/g, "");
  if (!factorId || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your app" }, { status: 400 });
  }

  const supabase = getSupabase();
  const ip = clientIpHash(req);
  if (!(await underLimit(supabase, "admin_mfa_fail_ip", ip, 10, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes." }, { status: 429 });
  }

  const tokens = await currentTokens();
  const user = tokens ? await getUserClient(tokens.access, tokens.refresh) : null;
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { data: challenge } = await user.auth.mfa.challenge({ factorId });
  const { data, error } = challenge
    ? await user.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
    : { data: null, error: new Error("no challenge") };
  if (error || !data) {
    await record(supabase, "admin_mfa_fail_ip", ip);
    return NextResponse.json({ error: "That code is not right. Try the next one your app shows." }, { status: 400 });
  }

  await audit("mfa_enabled");
  const res = NextResponse.json({ success: true });
  setSessionCookies(res, data); // the verified session is now two-step (aal2)
  return res;
}
