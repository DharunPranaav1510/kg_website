import { NextRequest, NextResponse } from "next/server";
import { getAuthClient, getSupabase } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = getAuthClient();
  const supabase = getSupabase();
  if (!auth || !supabase) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  }

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Valid Supabase user, but are they an admin? Same message so it can't be probed.
  const { data: admin } = await supabase
    .from("admins")
    .select("email")
    .ilike("email", email)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  setSessionCookies(res, data.session);
  return res;
}
