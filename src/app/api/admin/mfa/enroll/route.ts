import { NextResponse } from "next/server";
import { currentTokens, getAdmin, requireAdmin } from "@/lib/admin-auth";
import { getUserClient } from "@/lib/supabase";

// Start setting up two-step login: returns a QR code for an authenticator app.
export async function POST() {
  const denied = await requireAdmin({ allowMfaSetup: true });
  if (denied) return denied;
  const admin = (await getAdmin())!;
  if (admin.mfaEnabled) {
    return NextResponse.json({ error: "Two-step login is already on." }, { status: 400 });
  }
  const tokens = await currentTokens();
  const user = tokens ? await getUserClient(tokens.access, tokens.refresh) : null;
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  // Remove half-finished attempts so a retry never collides with an old one.
  const { data: factors } = await user.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status !== "verified") await user.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await user.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `KG Foods admin ${new Date().toISOString().slice(0, 10)}`,
    issuer: "KG Foods Admin",
  });
  if (error || !data) {
    return NextResponse.json({ error: "Couldn't start setup. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
}
