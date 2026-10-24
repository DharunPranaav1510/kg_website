import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/admin-auth";
import { parseAdminRequest } from "@/lib/admin-request";
import { clientIpHash } from "@/lib/guard";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/turnstile";

// Someone asks for admin access from the sign-in page. Nothing is granted here: the account they
// choose a password for cannot open the admin until the owner approves the request (the admin list
// is checked at every sign-in). The answer is the same whatever the email, so this cannot be used
// to find out who already is an admin.
const SENT = { success: true, message: "Request sent. The owner will review it. You can sign in once it is approved." };

export async function POST(req: NextRequest) {
  if (!(await isSameOrigin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Server is not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  // Hidden field a person never fills in: a bot does. Pretend it worked.
  if (typeof body?.website === "string" && body.website) return NextResponse.json(SENT);

  const parsed = parseAdminRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { email, name, password, note } = parsed.value;

  const ip = clientIpHash(req);
  if (!(await verifyTurnstile(body?.turnstileToken, req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null))) {
    return NextResponse.json({ error: "Please complete the security check and try again." }, { status: 400 });
  }
  if (!(await allow(supabase, "admin_request_ip", ip, 3, 60 * 60 * 1000)) || !(await allow(supabase, "admin_request_email", email, 2, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // Already an admin: nothing to request.
  const { data: existing } = await supabase.from("admins").select("email").ilike("email", email).maybeSingle();
  if (existing) return NextResponse.json(SENT);

  // The sign-in account. If the email already has one, keep its password: a stranger cannot change it.
  const { error: userError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (userError && !/already|registered|exists/i.test(userError.message)) {
    console.error("Admin request: could not create the login:", userError.message);
    return NextResponse.json({ error: "Could not send the request. Please try again." }, { status: 500 });
  }

  // One row per email. A rejected request can be asked again; an approved one stays approved.
  const { data: prior } = await supabase.from("admin_requests").select("id, status").ilike("email", email).maybeSingle();
  if (!prior) {
    const { error } = await supabase.from("admin_requests").insert({ email, name, note: note || null, ip_hash: ip });
    if (error) {
      console.error("Admin request insert failed:", error.message);
      return NextResponse.json({ error: "Could not send the request. Please try again." }, { status: 500 });
    }
  } else if (prior.status === "rejected") {
    await supabase.from("admin_requests").update({ name, note: note || null, status: "pending", decided_at: null, decided_by: null, created_at: new Date().toISOString(), ip_hash: ip }).eq("id", prior.id);
  }
  return NextResponse.json(SENT);
}
