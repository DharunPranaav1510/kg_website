import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { clientIpHash } from "@/lib/guard";
import { acceptInvite } from "@/lib/invite-flow";
import { record, underLimit } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";

const WINDOW = 15 * 60 * 1000;

// Public: the invited person enters the emailed code and chooses a password. This is what creates the admin.
export async function POST(req: NextRequest) {
  if (!(await isSameOrigin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Server is not configured" }, { status: 500 });

  const ip = clientIpHash(req);
  if (!(await underLimit(supabase, "invite_accept_fail", ip, 15, WINDOW))) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const r = await acceptInvite(supabase, {
    token: typeof body?.token === "string" ? body.token.slice(0, 200) : "",
    code: typeof body?.code === "string" ? body.code : "",
    password: typeof body?.password === "string" ? body.password : "",
  });
  if (r.countFail) await record(supabase, "invite_accept_fail", ip);
  if (r.status === 200 && r.email) await audit("admin_joined", r.email, { invitedBy: r.invitedBy }, r.email);
  return NextResponse.json(r.body, { status: r.status });
}
