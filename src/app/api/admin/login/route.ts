import { NextRequest, NextResponse } from "next/server";
import { setPendingLogin, setSessionCookies, verifiedTotpFactors } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { clientIpHash } from "@/lib/guard";
import { record, underLimit } from "@/lib/ratelimit";
import { getAuthClient, getSupabase } from "@/lib/supabase";

const WINDOW = 15 * 60 * 1000;
const tooMany = () =>
  NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });

export async function POST(req: NextRequest) {
  const auth = getAuthClient();
  const supabase = getSupabase();
  if (!auth || !supabase) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  }

  // Lock out guessing without letting a stranger lock the owner out. Three counters:
  //  - this device + this email: 5 tries (the normal "you typed it wrong" limit)
  //  - this device, any email: 10 tries
  //  - this email from anywhere: 40 tries, so one attacker cannot block the real admin
  //    with a handful of wrong passwords, but spreading guesses over many devices still stops.
  const ip = clientIpHash(req);
  const pair = `${email}|${ip}`;
  if (
    !(await underLimit(supabase, "admin_login_fail_pair", pair, 5, WINDOW)) ||
    !(await underLimit(supabase, "admin_login_fail_ip", ip, 10, WINDOW)) ||
    !(await underLimit(supabase, "admin_login_fail_email", email, 40, WINDOW))
  ) {
    return tooMany();
  }
  const reject = async (why: string) => {
    await Promise.all([
      record(supabase, "admin_login_fail_pair", pair),
      record(supabase, "admin_login_fail_ip", ip),
      record(supabase, "admin_login_fail_email", email),
    ]);
    await audit("login_failed", why, undefined, email);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  };

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    // Wrong keys / wrong project is a setup problem, not a typo: say so (visible to the owner only in logs + a hint).
    const code = (error as { code?: string } | null)?.code;
    console.error("[admin login] sign-in failed:", error?.status, code, error?.message);
    if (error && (error.status === 401 && /api key|apikey/i.test(error.message) || /fetch failed|network/i.test(error.message))) {
      return NextResponse.json({ error: "Server cannot reach Supabase with the configured keys. Check the Supabase env vars in Vercel and redeploy." }, { status: 500 });
    }
    return reject("bad password");
  }

  // Valid Supabase user, but are they an admin? Same message so it can't be probed.
  const { data: admin } = await supabase.from("admins").select("email").ilike("email", email).maybeSingle();
  if (!admin) {
    console.error("[admin login] password OK but email is not in the admins table (or the table is missing)");
    return reject("not an admin");
  }

  // Two-step login switched on? Don't hand out a session until the code is entered.
  if ((await verifiedTotpFactors(data.user.id)).length > 0) {
    const res = NextResponse.json({ mfaRequired: true });
    setPendingLogin(res, data.session);
    return res;
  }

  await audit("login", "password only", undefined, email);
  const res = NextResponse.json({ success: true });
  setSessionCookies(res, data.session);
  return res;
}
