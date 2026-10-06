import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { revalidateContent } from "@/lib/content";
import { isKind, toRow, validators } from "@/lib/content-admin";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

type Ctx = { params: Promise<{ kind: string; id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { kind, id } = await params;
  if (!isKind(kind) || !UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const checked = validators[kind](await req.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { sort: _ignored, ...fields } = toRow(kind, checked.value) as Record<string, unknown>;
  void _ignored;
  const { data, error } = await getSupabase()!.from(kind).update(fields).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to save", detail: dbDetail(error) }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("content_changed", `${kind}:update`, { id });
  revalidateContent();
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { kind, id } = await params;
  if (!isKind(kind) || !UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await getSupabase()!.from(kind).delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete", detail: dbDetail(error) }, { status: 500 });
  await audit("content_changed", `${kind}:delete`, { id });
  revalidateContent();
  return NextResponse.json({ success: true });
}
