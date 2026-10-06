import { Resend } from "resend";

// One place that sends email through Resend (https://resend.com).
//  RESEND_API_KEY  the key from Resend
//  RESEND_FROM     e.g. "KG Foods <admin@kgfoods.co.in>". The address must be on a domain you verified in Resend.
//                  Resend's test sender (onboarding@resend.dev) only delivers to your own Resend login email.

export type MailResult = { ok: true; devOnly?: boolean } | { ok: false; error: string };

export const mailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      // On your own computer there is no need for a real mailbox: the message is printed in the terminal.
      console.log(`\n[mail → ${opts.to}] ${opts.subject}\n${opts.text}\n`);
      return { ok: true, devOnly: true };
    }
    return { ok: false, error: "Email is not set up yet. Add RESEND_API_KEY and RESEND_FROM in Vercel, then redeploy." };
  }
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env.RESEND_FROM || "KG Foods <onboarding@resend.dev>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("Resend error:", error);
      const msg = String((error as { message?: string }).message ?? "");
      const hint = /domain|verify|testing emails|own email/i.test(msg)
        ? " Verify your domain in Resend and set RESEND_FROM to an address on it."
        : "";
      return { ok: false, error: `The email could not be sent (${msg || "unknown error"}).${hint}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Mail send failed:", err);
    return { ok: false, error: "The email could not be sent. Please try again." };
  }
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shell(title: string, bodyHtml: string) {
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#111;">
    <div style="background:#D63E0A;color:#fff;padding:20px 28px;border-radius:12px 12px 0 0;"><strong style="font-size:18px;">${esc(title)}</strong></div>
    <div style="border:1px solid #eee;border-top:none;padding:26px 28px;border-radius:0 0 12px 12px;font-size:15px;line-height:1.55;">${bodyHtml}</div>
    <p style="color:#888;font-size:12px;margin:14px 4px;">If you were not expecting this email you can ignore it. Nothing happens unless you open the link and enter the code.</p>
  </div>`;
}

export function inviteEmail(opts: { shopName: string; invitedBy: string; link: string; hours: number }) {
  const { shopName, invitedBy, link, hours } = opts;
  return {
    subject: `You're invited to manage ${shopName}`,
    text: `${invitedBy} invited you to manage ${shopName} (admin access).\n\nOpen this link to set up your account:\n${link}\n\nThe link works for ${hours} hours. On that page you'll ask for a verification code, which is sent to this same address, and then choose your password.\n\nIf you did not expect this, ignore this email.`,
    html: shell(
      `Admin invitation for ${shopName}`,
      `<p><b>${esc(invitedBy)}</b> invited you to manage <b>${esc(shopName)}</b> as an admin.</p>
       <p><a href="${esc(link)}" style="display:inline-block;background:#D63E0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">Set up my account</a></p>
       <p style="color:#555;">On that page you will ask for a verification code (we email it to this address) and choose your password. The link works for ${hours} hours.</p>
       <p style="color:#888;font-size:13px;word-break:break-all;">Or copy this address: ${esc(link)}</p>`
    ),
  };
}

export function codeEmail(opts: { shopName: string; code: string; minutes: number }) {
  const { shopName, code, minutes } = opts;
  return {
    subject: `${code} is your ${shopName} admin verification code`,
    text: `Your verification code is ${code}. It works for ${minutes} minutes. Never share it with anyone.`,
    html: shell(
      "Your verification code",
      `<p>Enter this code on the invitation page to continue:</p>
       <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:14px 0;">${esc(code)}</p>
       <p style="color:#555;">It works for ${minutes} minutes and only once. We will never ask you for it by phone or chat.</p>`
    ),
  };
}
