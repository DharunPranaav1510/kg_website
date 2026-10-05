import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { audit } from "@/lib/audit";
import { normalizeIndianMobile } from "@/lib/phone";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await getSupabase()!
    .from("blocked_phones")
    .select("phone, reason, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  return NextResponse.json({ blocked: data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const phone = normalizeIndianMobile(String(body?.phone ?? ""));
  if (!phone) return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 200) : null;

  const { error } = await getSupabase()!
    .from("blocked_phones")
    .upsert({ phone, reason: reason || null });
  if (error) return NextResponse.json({ error: "Failed to block" }, { status: 500 });
  await audit("number_blocked", phone, reason ? { reason } : undefined);
  return NextResponse.json({ success: true, phone });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  const { error } = await getSupabase()!.from("blocked_phones").delete().eq("phone", phone);
  if (error) return NextResponse.json({ error: "Failed to unblock" }, { status: 500 });
  await audit("number_unblocked", phone);
  return NextResponse.json({ success: true });
}
