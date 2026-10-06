import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getBusinessFresh, revalidateContent } from "@/lib/content";
import { dbDetail } from "@/lib/db-error";
import { validateHours } from "@/lib/hours";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ hours: (await getBusinessFresh()).hours.schedule });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const checked = validateHours(await req.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const { error } = await getSupabase()!.from("settings").upsert({
    key: "hours",
    value: checked.value,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Failed to save", detail: dbDetail(error) }, { status: 500 });
  await audit("hours_changed", undefined, { exceptions: checked.value.exceptions.length });
  revalidateContent();
  return NextResponse.json({ hours: (await getBusinessFresh()).hours.schedule });
}
