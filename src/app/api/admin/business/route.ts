import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getBusinessFresh, revalidateContent } from "@/lib/content";
import { validateBusiness } from "@/lib/content-schema";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ business: await getBusinessFresh() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const checked = validateBusiness(await req.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const { error } = await getSupabase()!.from("settings").upsert({
    key: "business",
    value: checked.value,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Failed to save", detail: dbDetail(error) }, { status: 500 });
  await audit("business_changed", undefined, { delivery: checked.value.delivery });
  revalidateContent();
  return NextResponse.json({ business: await getBusinessFresh() });
}
