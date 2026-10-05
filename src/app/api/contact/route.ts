import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clientIpHash, LIMITS } from "@/lib/guard";
import { formatPhone, normalizeEmail, normalizeIndianMobile } from "@/lib/phone";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/turnstile";

// Email is optional: skipped when RESEND_API_KEY is not set.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fail = (error: string, status = 400, field?: string) =>
  NextResponse.json({ error, ...(field ? { field } : {}) }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request");

    if (!(await allow(getSupabase(), "contact_attempt", clientIpHash(req), 10, 10 * 60 * 1000))) {
      return fail("Too many attempts. Please wait a few minutes or call the shop.", 429);
    }
    if (!(await verifyTurnstile(body.turnstileToken, req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null))) {
      return fail("Please complete the security check and try again.");
    }

    // Bot trap + minimum fill time (see the order route).
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }
    const elapsed = Date.now() - Number(body.startedAt);
    if (!Number.isFinite(elapsed) || elapsed < 3000) {
      return fail("Please take a moment to review your message and try again.");
    }

    const name = str(body.name, 80);
    if (name.length < 2) return fail("Please enter your name", 400, "name");
    const phone = normalizeIndianMobile(str(body.phone, 25));
    if (!phone) return fail("Enter a valid 10-digit mobile number", 400, "phone");
    const emailResult = normalizeEmail(str(body.email, 130));
    if (emailResult === null) return fail("That email doesn't look right", 400, "email");
    const email = emailResult ?? null;
    const message = str(body.message, 2000);
    if (message.length < 10) return fail("Message must be at least 10 characters", 400, "message");

    const supabase = getSupabase();
    const ipHash = clientIpHash(req);
    if (supabase) {
      const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
      const { count } = await supabase
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", hourAgo);
      if ((count ?? 0) >= LIMITS.enquiryPerHour) {
        return fail("Too many messages from this device. Please call the shop instead.", 429);
      }
      const { error } = await supabase
        .from("enquiries")
        .insert({ name, email, phone, message, ip_hash: ipHash });
      if (error) {
        console.error("Supabase enquiry insert error:", error);
        return fail("We couldn't send your message. Please try again or call us.", 500);
      }
    }

    try {
      await resend?.emails.send({
        from: "onboarding@resend.dev",
        to: "dskarthik63@gmail.com",
        subject: `New Enquiry from ${name} — KG Meat Mart`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>New enquiry</h2>
            <p><strong>Name:</strong> ${esc(name)}</p>
            <p><strong>Phone:</strong> ${esc(formatPhone(phone))}</p>
            ${email ? `<p><strong>Email:</strong> ${esc(email)}</p>` : ""}
            <p style="white-space:pre-wrap">${esc(message)}</p>
          </div>`,
      });
    } catch (err) {
      console.error("Contact email error:", err);
      if (!supabase) throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact error:", err);
    return fail("Failed to send message", 500);
  }
}
