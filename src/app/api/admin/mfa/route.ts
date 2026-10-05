import { NextResponse } from "next/server";
import { currentTokens, getAdmin, requireAdmin, requireMfa, verifiedTotpFactors } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getUserClient } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin({ allowMfaSetup: true });
  if (denied) return denied;
  const admin = (await getAdmin())!;
  return NextResponse.json({ enabled: admin.mfaEnabled, required: requireMfa() });
}

// Turn two-step login off (only when it isn't compulsory).
export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (requireMfa()) {
    return NextResponse.json({ error: "Two-step login is required for all admins and can't be turned off." }, { status: 400 });
  }
  const admin = (await getAdmin())!;
  const tokens = await currentTokens();
  const user = tokens ? await getUserClient(tokens.access, tokens.refresh) : null;
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  for (const f of await verifiedTotpFactors(admin.userId)) {
    const { error } = await user.auth.mfa.unenroll({ factorId: f.id });
    if (error) return NextResponse.json({ error: "Couldn't turn it off. Sign in again and retry." }, { status: 400 });
  }
  await audit("mfa_disabled");
  return NextResponse.json({ success: true });
}
