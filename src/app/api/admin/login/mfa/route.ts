import { NextRequest, NextResponse } from "next/server";
import { clearPendingLogin, readPendingLogin, setSessionCookies, verifiedTotpFactors } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { clientIpHash } from "@/lib/guard";
import { record, underLimit } from "@/lib/ratelimit";
import { getSupabase, getUserClient } from "@/lib/supabase";

const WINDOW = 15 * 60 * 1000;

// Step 2 of login: the 6-digit code from the authenticator app.
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const pending = await readPendingLogin();
  if (!supabase || !pending) {
    return NextResponse.json({ error: "Your login expired. Please sign in again.", restart: true }, { status: 401 });
  }

  const code = String((await req.json().catch(() => null))?.code ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }

  const ip = clientIpHash(req);
  if (!(await underLimit(supabase, "admin_mfa_fail_ip", ip, 10, WINDOW))) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }

  const user = await getUserClient(pending.access, pending.refresh);
  const who = user ? (await user.auth.getUser()).data.user : null;
  if (!user || !who?.id) {
    const res = NextResponse.json({ error: "Your login expired. Please sign in again.", restart: true }, { status: 401 });
    clearPendingLogin(res);
    return res;
  }
  const email = who.email?.toLowerCase() ?? "unknown";

  const factor = (await verifiedTotpFactors(who.id))[0];
  const { data: challenge } = factor ? await user.auth.mfa.challenge({ factorId: factor.id }) : { data: null };
  const { data, error } =
    factor && challenge
      ? await user.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code })
      : { data: null, error: new Error("no factor") };

  if (error || !data) {
    await record(supabase, "admin_mfa_fail_ip", ip);
    await audit("login_failed", "wrong 2-step code", undefined, email);
    return NextResponse.json({ error: "That code is not right. Wait for a new one and try again." }, { status: 401 });
  }

  await audit("login", "password + 2-step code", undefined, email);
  const res = NextResponse.json({ success: true });
  setSessionCookies(res, data);
  clearPendingLogin(res);
  return res;
}
