import type { SupabaseClient } from "@supabase/supabase-js";
import { business } from "@/data/business";
import {
  hashOtp,
  hashToken,
  isOpenInvite,
  maskEmail,
  newOtp,
  otpMatches,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS,
  OTP_RESEND_SECONDS,
  OTP_TTL_MINUTES,
} from "@/lib/invites";
import { codeEmail, sendMail } from "@/lib/mailer";
import { checkPassword } from "@/lib/password";

export const INVALID_LINK = "This invitation link isn't valid or has expired. Ask an admin to send you a new one.";

export type FlowResult = { status: number; body: Record<string, unknown>; /** counts toward the guessing limit */ countFail?: boolean };

/** The invited person asks for the 6 digit code. It is only ever emailed to the invited address. */
export async function requestInviteCode(supabase: SupabaseClient, token: string, send = sendMail): Promise<FlowResult> {
  if (!token) return { status: 400, body: { error: INVALID_LINK } };
  const tokenHash = hashToken(token);
  const { data: inv } = await supabase
    .from("admin_invites")
    .select("id, email, expires_at, used_at, revoked_at, otp_expires_at, otp_sends, last_otp_sent_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!inv || !isOpenInvite(inv)) return { status: 400, body: { error: INVALID_LINK } };

  if ((inv.otp_sends ?? 0) >= OTP_MAX_SENDS) {
    return { status: 429, body: { error: "Too many codes were requested for this invitation. Ask an admin to send a new invitation." } };
  }
  if (inv.last_otp_sent_at) {
    const wait = OTP_RESEND_SECONDS - Math.floor((Date.now() - new Date(inv.last_otp_sent_at).getTime()) / 1000);
    if (wait > 0) return { status: 429, body: { error: `Please wait ${wait} seconds before asking for another code.`, wait } };
  }

  const code = newOtp();
  const mail = codeEmail({ shopName: business.name, code, minutes: OTP_TTL_MINUTES });
  const sent = await send({ to: inv.email, ...mail });
  if (!sent.ok) return { status: 502, body: { error: sent.error } };

  const { error } = await supabase
    .from("admin_invites")
    .update({
      otp_hash: hashOtp(tokenHash, code),
      otp_expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
      otp_attempts: 0,
      otp_sends: (inv.otp_sends ?? 0) + 1,
      last_otp_sent_at: new Date().toISOString(),
    })
    .eq("id", inv.id);
  if (error) return { status: 500, body: { error: "Could not prepare the code. Please try again." } };

  return {
    status: 200,
    body: {
      success: true,
      sentTo: maskEmail(inv.email),
      resendIn: OTP_RESEND_SECONDS,
      // Only on your own computer without a mail key: shown so the flow can be tested.
      devCode: sent.devOnly ? code : undefined,
    },
  };
}

async function findUserId(supabase: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; page <= 25; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const hit = data?.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (!data || data.users.length < 200) return null;
  }
  return null;
}

/** The invited person proves the emailed code and chooses a password. This is what creates the admin. */
export async function acceptInvite(
  supabase: SupabaseClient,
  input: { token: string; code: string; password: string }
): Promise<FlowResult & { email?: string; invitedBy?: string }> {
  const { token } = input;
  const code = input.code.replace(/\s+/g, "");
  if (!token) return { status: 400, body: { error: INVALID_LINK }, countFail: true };

  const tokenHash = hashToken(token);
  const { data: inv } = await supabase
    .from("admin_invites")
    .select("id, email, invited_by, expires_at, used_at, revoked_at, otp_hash, otp_expires_at, otp_attempts")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!inv || !isOpenInvite(inv)) return { status: 400, body: { error: INVALID_LINK }, countFail: true };

  if (!inv.otp_hash || !inv.otp_expires_at || new Date(inv.otp_expires_at).getTime() <= Date.now()) {
    return { status: 400, body: { error: "That code has expired. Ask for a new code.", needNewCode: true }, countFail: true };
  }
  if ((inv.otp_attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    return { status: 400, body: { error: "Too many wrong codes. Ask for a new code.", needNewCode: true }, countFail: true };
  }
  if (!otpMatches(tokenHash, code, inv.otp_hash)) {
    const attempts = (inv.otp_attempts ?? 0) + 1;
    await supabase.from("admin_invites").update({ otp_attempts: attempts, ...(attempts >= OTP_MAX_ATTEMPTS ? { otp_hash: null } : {}) }).eq("id", inv.id);
    const left = OTP_MAX_ATTEMPTS - attempts;
    return {
      status: 400,
      body: { error: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong codes. Ask for a new code.", needNewCode: left <= 0 },
      countFail: true,
    };
  }

  const pw = checkPassword(input.password, inv.email);
  if (!pw.ok) return { status: 400, body: { error: pw.problem } }; // the code was right, so this is not a guess

  // Claim the invitation first so it can only ever be used once, even if two requests arrive together.
  const { data: claimed } = await supabase
    .from("admin_invites")
    .update({ used_at: new Date().toISOString(), otp_hash: null })
    .eq("id", inv.id)
    .is("used_at", null)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return { status: 400, body: { error: INVALID_LINK }, countFail: true };

  const email = inv.email.toLowerCase();
  try {
    const created = await supabase.auth.admin.createUser({ email, password: input.password, email_confirm: true });
    if (created.error) {
      // An older login for this address may still exist (for example a removed admin): reset it.
      const id = await findUserId(supabase, email);
      if (!id) throw created.error;
      const updated = await supabase.auth.admin.updateUserById(id, { password: input.password, email_confirm: true });
      if (updated.error) throw updated.error;
    }
    const { error } = await supabase.from("admins").upsert({ email, added_by: inv.invited_by, added_at: new Date().toISOString() });
    if (error) throw error;
  } catch (err) {
    console.error("Admin invite accept failed:", err);
    await supabase.from("admin_invites").update({ used_at: null }).eq("id", inv.id);
    return { status: 500, body: { error: "We couldn't create your account. Please try again, or ask for a new invitation." } };
  }

  return { status: 200, body: { success: true }, email, invitedBy: inv.invited_by };
}
