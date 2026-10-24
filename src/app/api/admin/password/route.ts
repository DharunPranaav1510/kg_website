import { NextResponse } from "next/server";
import { clearSessionCookies, currentTokens, forgetAdminSession, getAdmin, requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { record, underLimit } from "@/lib/ratelimit";
import { getAuthClient, getSupabase } from "@/lib/supabase";

const WINDOW = 15 * 60 * 1000;

// Change your own password. Needs the current one, then signs out every device.
export async function POST(req: Request) {
  const denied = await requireAdmin({ allowMfaSetup: true });
  if (denied) return denied;
  const admin = (await getAdmin())!;
  const supabase = getSupabase();
  const auth = getAuthClient();
  if (!supabase || !auth) return NextResponse.json({ error: "Server is not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (!current) return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  if (next.length < 10 || next.length > 72) {
    return NextResponse.json({ error: "The new password must be 10 to 72 characters." }, { status: 400 });
  }
  if (next === current) return NextResponse.json({ error: "The new password is the same as the current one." }, { status: 400 });

  if (!(await underLimit(supabase, "admin_password_fail", admin.email, 5, WINDOW))) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }
  const { error: badCurrent } = await auth.auth.signInWithPassword({ email: admin.email, password: current });
  if (badCurrent) {
    await record(supabase, "admin_password_fail", admin.email);
    return NextResponse.json({ error: "Your current password is not right." }, { status: 400 });
  }

  const { error } = await supabase.auth.admin.updateUserById(admin.userId, { password: next });
  if (error) return NextResponse.json({ error: "Couldn't change the password. Try a stronger one." }, { status: 400 });

  await audit("password_changed");
  const tokens = await currentTokens();
  if (tokens) {
    await supabase.auth.admin.signOut(tokens.access, "global").catch(() => {});
    forgetAdminSession(tokens.access);
  }
  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
