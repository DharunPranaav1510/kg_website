import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

// Admin invitations: a long random link token plus a 6 digit code that is emailed when the invited person asks for it.

export const INVITE_TTL_HOURS = 48;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS = 5;
export const OTP_RESEND_SECONDS = 60;
export const MAX_PENDING_INVITES = 20;

export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

function secret() {
  return process.env.INVITE_SECRET ?? process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "kg-invites";
}

/** The code is stored as an HMAC tied to its invite, so it cannot be reused on another invite or read from the database. */
export const hashOtp = (tokenHash: string, otp: string) => createHmac("sha256", secret()).update(`${tokenHash}:${otp}`).digest("hex");

export function otpMatches(tokenHash: string, otp: string, stored: string | null): boolean {
  if (!stored || !/^\d{6}$/.test(otp)) return false;
  const a = Buffer.from(hashOtp(tokenHash, otp), "hex");
  const b = Buffer.from(stored, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** "dharun@gmail.com" -> "d•••••@gmail.com" */
export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(name.length - 1, 6)))}@${domain}`;
}

export type InviteRow = {
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  otp_expires_at: string | null;
  otp_sends?: number | null;
};
export type InviteStatus = "waiting" | "code_sent" | "expired" | "accepted" | "revoked";

export function inviteStatus(r: InviteRow, now = Date.now()): InviteStatus {
  if (r.used_at) return "accepted";
  if (r.revoked_at) return "revoked";
  if (new Date(r.expires_at).getTime() <= now) return "expired";
  if (r.otp_expires_at && new Date(r.otp_expires_at).getTime() > now) return "code_sent";
  return "waiting";
}

export const isOpenInvite = (r: InviteRow, now = Date.now()) => {
  const s = inviteStatus(r, now);
  return s === "waiting" || s === "code_sent";
};
