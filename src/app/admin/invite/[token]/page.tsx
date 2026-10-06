import type { Metadata } from "next";
import Image from "next/image";
import { business } from "@/data/business";
import { hashToken, isOpenInvite, maskEmail } from "@/lib/invites";
import { getSupabase } from "@/lib/supabase";
import InviteForm from "./InviteForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin invitation", robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabase();
  const { data: inv } = supabase
    ? await supabase
        .from("admin_invites")
        .select("email, invited_by, expires_at, used_at, revoked_at, otp_expires_at")
        .eq("token_hash", hashToken(token.slice(0, 200)))
        .maybeSingle()
    : { data: null };
  const valid = !!inv && isOpenInvite(inv);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-warm-gray bg-white p-6 shadow-card sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-warm-gray bg-white">
            <Image src="/images/logo/kg-logo.png" alt="" width={32} height={32} className="object-contain" />
          </span>
          <span className="font-display text-lg">{business.name}</span>
        </div>
        {valid ? (
          <InviteForm token={token} maskedEmail={maskEmail(inv!.email)} invitedBy={inv!.invited_by} />
        ) : (
          <div>
            <h1 className="font-display text-2xl">This link isn&apos;t valid</h1>
            <p className="mt-2 text-sm text-secondary-text">
              The invitation has expired, was cancelled, or has already been used. Ask an admin to send you a new invitation.
            </p>
            <a href="/admin/login" className="btn-secondary mt-6 w-full">Go to sign in</a>
          </div>
        )}
      </div>
    </main>
  );
}
