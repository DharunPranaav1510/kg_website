import { NextRequest, NextResponse } from "next/server";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { issueInvite } from "@/lib/invite-send";
import { isOpenInvite } from "@/lib/invites";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Resend: a fresh link (the old one stops working) and a fresh 48 hours.
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const me = (await getAdmin())!.email;
  const supabase = getSupabase()!;
  if (!(await allow(supabase, "admin_invite", me, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "You have sent many invitations in the last hour. Please wait a while." }, { status: 429 });
  }
  const { data: inv } = await supabase.from("admin_invites").select("id, email, expires_at, used_at, revoked_at, otp_expires_at").eq("id", id).maybeSingle();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.used_at) return NextResponse.json({ error: "This invitation was already accepted." }, { status: 409 });
  // An expired or cancelled invite can be sent again; clear the cancel mark first.
  if (!isOpenInvite(inv)) await supabase.from("admin_invites").update({ revoked_at: null }).eq("id", id);
  const res = await issueInvite(req, supabase, { id, email: inv.email, invitedBy: me });
  if (!res.ok) return NextResponse.json({ error: res.error, detail: res.detail }, { status: res.status });
  await audit("admin_invited", inv.email, { resent: true });
  return NextResponse.json({ success: true, devLink: res.devLink });
}

// Cancel an invitation.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await getSupabase()!
    .from("admin_invites")
    .update({ revoked_at: new Date().toISOString(), otp_hash: null })
    .eq("id", id)
    .is("used_at", null)
    .select("email")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("admin_invite_revoked", data.email);
  return NextResponse.json({ success: true });
}
