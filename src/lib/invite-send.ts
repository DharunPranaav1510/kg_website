import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { business } from "@/data/business";
import { hashToken, INVITE_TTL_HOURS, newToken } from "@/lib/invites";
import { inviteEmail, sendMail, type MailResult } from "@/lib/mailer";
import { siteUrl } from "@/lib/site-url";

/**
 * Creates (or renews) the link for an invite row and emails it.
 * A new token is issued each time, so an older link stops working as soon as an invite is resent.
 */
export async function issueInvite(
  req: NextRequest,
  supabase: SupabaseClient,
  opts: { id?: string; email: string; invitedBy: string }
): Promise<{ ok: true; id: string; devLink?: string } | { ok: false; status: number; error: string; detail?: string }> {
  const token = newToken();
  const expires = new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000).toISOString();
  const link = `${siteUrl(req)}/admin/invite/${token}`;

  let id = opts.id;
  if (id) {
    const { error } = await supabase
      .from("admin_invites")
      .update({ token_hash: hashToken(token), expires_at: expires, otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_sends: 0, last_otp_sent_at: null })
      .eq("id", id);
    if (error) return { ok: false, status: 500, error: "Could not renew the invitation.", detail: error.message };
  } else {
    const { data, error } = await supabase
      .from("admin_invites")
      .insert({ email: opts.email, token_hash: hashToken(token), expires_at: expires, invited_by: opts.invitedBy })
      .select("id")
      .single();
    if (error) return { ok: false, status: 500, error: "Could not save the invitation.", detail: error.message };
    id = data.id as string;
  }

  const mail = inviteEmail({ shopName: business.name, invitedBy: opts.invitedBy, link, hours: INVITE_TTL_HOURS });
  const sent: MailResult = await sendMail({ to: opts.email, ...mail });
  if (!sent.ok) {
    // Nobody can use a link that was never delivered, so do not leave it lying around.
    await supabase.from("admin_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    return { ok: false, status: 502, error: sent.error };
  }
  return { ok: true, id: id!, devLink: sent.devOnly ? link : undefined };
}
