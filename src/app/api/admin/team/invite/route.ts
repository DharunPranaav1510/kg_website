import { NextRequest, NextResponse } from "next/server";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { issueInvite } from "@/lib/invite-send";
import { MAX_PENDING_INVITES } from "@/lib/invites";
import { normalizeEmail } from "@/lib/phone";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";

// An existing admin invites a new one by email.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = (await getAdmin())!.email;
  const supabase = getSupabase()!;

  if (!(await allow(supabase, "admin_invite", me, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "You have sent many invitations in the last hour. Please wait a while." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const raw = typeof body?.email === "string" ? body.email.trim() : "";
  const email = normalizeEmail(raw);
  if (!email) return NextResponse.json({ error: "Enter the new admin's email address." }, { status: 400 });

  const { data: existing } = await supabase.from("admins").select("email").ilike("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "That person is already an admin." }, { status: 409 });

  const nowIso = new Date().toISOString();
  const { data: open } = await supabase
    .from("admin_invites")
    .select("id, email")
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", nowIso);
  if ((open ?? []).some((o) => o.email.toLowerCase() === email)) {
    return NextResponse.json({ error: "There is already a pending invitation for this email. Resend or cancel it below." }, { status: 409 });
  }
  if ((open ?? []).length >= MAX_PENDING_INVITES) {
    return NextResponse.json({ error: "Too many invitations are waiting. Cancel some first." }, { status: 409 });
  }

  const res = await issueInvite(req, supabase, { email, invitedBy: me });
  if (!res.ok) return NextResponse.json({ error: res.error, detail: res.detail }, { status: res.status });
  await audit("admin_invited", email);
  return NextResponse.json({ success: true, devLink: res.devLink });
}
