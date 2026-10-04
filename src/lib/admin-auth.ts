import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthClient, getSupabase } from "@/lib/supabase";

const ACCESS_COOKIE = "kg_admin_at";
const REFRESH_COOKIE = "kg_admin_rt";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export interface Admin {
  email: string;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function hasRefreshCookie(): Promise<boolean> {
  return Boolean((await cookies()).get(REFRESH_COOKIE)?.value);
}

// Returns the signed-in admin, or null. Only emails in the `admins` table pass.
export async function getAdmin(): Promise<Admin | null> {
  const supabase = getSupabase();
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!supabase || !token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return null;

  const { data: row } = await supabase
    .from("admins")
    .select("email")
    .ilike("email", email)
    .maybeSingle();
  return row ? { email } : null;
}

export async function requireAdmin(): Promise<NextResponse | null> {
  return (await getAdmin())
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function setSessionCookies(
  res: NextResponse,
  session: { access_token: string; refresh_token: string; expires_in: number }
) {
  res.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...cookieBase,
    maxAge: session.expires_in,
  });
  res.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...cookieBase,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export async function refreshSession() {
  const auth = getAuthClient();
  const refresh_token = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!auth || !refresh_token) return null;
  const { data, error } = await auth.auth.refreshSession({ refresh_token });
  return error || !data.session ? null : data.session;
}
