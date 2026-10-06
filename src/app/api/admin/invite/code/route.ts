import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/admin-auth";
import { clientIpHash } from "@/lib/guard";
import { requestInviteCode } from "@/lib/invite-flow";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";

// Public: the invited person asks for the 6 digit code.
export async function POST(req: NextRequest) {
  if (!(await isSameOrigin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Server is not configured" }, { status: 500 });

  if (!(await allow(supabase, "invite_code_ip", clientIpHash(req), 15, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Please try again in an hour." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.slice(0, 200) : "";
  const r = await requestInviteCode(supabase, token);
  return NextResponse.json(r.body, { status: r.status });
}
