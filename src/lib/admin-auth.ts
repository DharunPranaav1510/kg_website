import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { decideAccess, decodeAal } from "@/lib/admin-access";
import { getAuthClient, getSupabase } from "@/lib/supabase";

const ACCESS_COOKIE = "kg_admin_at";
const REFRESH_COOKIE = "kg_admin_rt";
const PENDING_COOKIE = "kg_admin_mfa"; // password accepted, waiting for the 6-digit code
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;
const PENDING_MAX_AGE = 60 * 5;

export interface Admin {
  email: string;
  userId: string;
  /** Two-step login is switched on for this account. */
  mfaEnabled: boolean;
  /** ADMIN_REQUIRE_MFA is on and this account has not set it up yet. */
  mfaSetupRequired: boolean;
}

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const requireMfa = () => process.env.ADMIN_REQUIRE_MFA === "true";

export async function hasRefreshCookie(): Promise<boolean> {
  return Boolean((await cookies()).get(REFRESH_COOKIE)?.value);
}

export async function currentTokens(): Promise<{ access: string; refresh: string } | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  return access && refresh ? { access, refresh } : null;
}

export async function verifiedTotpFactors(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.auth.admin.getUserById(userId);
  return (data.user?.factors ?? []).filter((f) => f.factor_type === "totp" && f.status === "verified");
}

/**
 * Returns the signed-in admin, or null. Only emails in the `admins` table pass,
 * and an account with two-step login only counts once the code was entered.
 */
export async function getAdmin(): Promise<Admin | null> {
  const supabase = getSupabase();
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!supabase || !token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  const userId = data.user?.id;
  if (error || !email || !userId) return null;

  const { data: row } = await supabase.from("admins").select("email").ilike("email", email).maybeSingle();
  if (!row) return null;

  const aal = decodeAal(token);
  // aal2 means a code was already entered, so a factor certainly exists.
  const hasFactor = aal === "aal2" || (await verifiedTotpFactors(userId)).length > 0;
  const access = decideAccess({ aal, hasVerifiedFactor: hasFactor, requireMfa: requireMfa() });
  if (access === "deny") return null;
  return { email, userId, mfaEnabled: hasFactor, mfaSetupRequired: access === "setup" };
}

/**
 * Browsers attach an Origin header to cross-site and to same-site POST/PUT/
 * PATCH/DELETE requests. If it is present and is not our own site, someone is
 * trying to drive the admin from another page: refuse. (SameSite=Strict
 * cookies already block this; this is a second layer.)
 */
export async function isSameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function requireAdmin(opts: { allowMfaSetup?: boolean } = {}): Promise<NextResponse | null> {
  if (!(await isSameOrigin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.mfaSetupRequired && !opts.allowMfaSetup) {
    return NextResponse.json({ error: "Set up two-step login first.", mfaSetupRequired: true }, { status: 403 });
  }
  return null;
}

export function setSessionCookies(res: NextResponse, session: SessionTokens) {
  res.cookies.set(ACCESS_COOKIE, session.access_token, { ...cookieBase, maxAge: session.expires_in });
  res.cookies.set(REFRESH_COOKIE, session.refresh_token, { ...cookieBase, maxAge: REFRESH_MAX_AGE });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
  res.cookies.set(PENDING_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/** Password was right but the 6-digit code is still needed: park the half-finished login for 5 minutes. */
export function setPendingLogin(res: NextResponse, session: SessionTokens) {
  const value = Buffer.from(JSON.stringify({ a: session.access_token, r: session.refresh_token })).toString("base64url");
  res.cookies.set(PENDING_COOKIE, value, { ...cookieBase, maxAge: PENDING_MAX_AGE });
}

export function clearPendingLogin(res: NextResponse) {
  res.cookies.set(PENDING_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export async function readPendingLogin(): Promise<{ access: string; refresh: string } | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    return typeof v.a === "string" && typeof v.r === "string" ? { access: v.a, refresh: v.r } : null;
  } catch {
    return null;
  }
}

export async function refreshSession() {
  const auth = getAuthClient();
  const refresh_token = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!auth || !refresh_token) return null;
  const { data, error } = await auth.auth.refreshSession({ refresh_token });
  return error || !data.session ? null : data.session;
}
