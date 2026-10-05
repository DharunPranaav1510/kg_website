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

  // Lock out guessing: per device and per email, shared across all servers.
  const ip = clientIpHash(req);
  if (
    !(await underLimit(supabase, "admin_login_fail_ip", ip, 10, WINDOW)) ||
    !(await underLimit(supabase, "admin_login_fail_email", email, 5, WINDOW))
  ) {
    return tooMany();
  }
  const reject = async (why: string) => {
    await Promise.all([record(supabase, "admin_login_fail_ip", ip), record(supabase, "admin_login_fail_email", email)]);
    await audit("login_failed", why, undefined, email);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  };

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) return reject("bad password");

  // Valid Supabase user, but are they an admin? Same message so it can't be probed.
  const { data: admin } = await supabase.from("admins").select("email").ilike("email", email).maybeSingle();
  if (!admin) return reject("not an admin");

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
