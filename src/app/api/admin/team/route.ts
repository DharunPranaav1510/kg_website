import { NextResponse } from "next/server";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { dbDetail } from "@/lib/db-error";
import { inviteStatus } from "@/lib/invites";
import { mailConfigured } from "@/lib/mailer";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = (await getAdmin())!.email;
  const supabase = getSupabase()!;
  const [{ data: admins, error }, { data: invites, error: e2 }] = await Promise.all([
    supabase.from("admins").select("email, added_by, added_at").order("added_at", { ascending: true }),
    supabase
      .from("admin_invites")
      .select("id, email, invited_by, created_at, expires_at, used_at, revoked_at, otp_expires_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (error || e2) {
    return NextResponse.json({ error: "Failed to load", detail: dbDetail((error ?? e2) as { message?: string }) }, { status: 500 });
  }
  return NextResponse.json({
    me,
    emailReady: mailConfigured() || process.env.NODE_ENV !== "production",
    admins: (admins ?? []).map((a) => ({ ...a, you: a.email.toLowerCase() === me })),
    invites: (invites ?? []).map((i) => ({ id: i.id, email: i.email, invited_by: i.invited_by, created_at: i.created_at, expires_at: i.expires_at, status: inviteStatus(i) })),
  });
}
