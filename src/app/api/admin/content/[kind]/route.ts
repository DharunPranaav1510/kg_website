import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { revalidateContent } from "@/lib/content";
import { defaultItems, isKind, toRow, validators } from "@/lib/content-admin";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

type Ctx = { params: Promise<{ kind: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// List everything (including hidden items). While the table is empty the built-in content is shown as "defaults".
export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { kind } = await params;
  if (!isKind(kind)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await getSupabase()!.from(kind).select("*").order("sort").order("created_at");
  if (error) return NextResponse.json({ error: "Failed to load", detail: dbDetail(error) }, { status: 500 });
  if (!data.length) return NextResponse.json({ items: defaultItems(kind), usingDefaults: true });
  return NextResponse.json({ items: data, usingDefaults: false });
}

// Create one item, or copy the built-in content into the database ({ seed: true }).
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { kind } = await params;
  if (!isKind(kind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = getSupabase()!;
  const body = await req.json().catch(() => null);

  const { count } = await supabase.from(kind).select("id", { count: "exact", head: true });

  if (body?.seed === true) {
    if (count) return NextResponse.json({ error: "Already set up" }, { status: 409 });
    const rows = defaultItems(kind).map((d) => toRow(kind, d));
    const { error } = await supabase.from(kind).insert(rows);
    if (error) return NextResponse.json({ error: "Failed to copy", detail: dbDetail(error) }, { status: 500 });
    await audit("content_changed", `${kind}:seed`, { count: rows.length });
    revalidateContent();
    return NextResponse.json({ success: true });
  }

  const checked = validators[kind](body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { data: last } = await supabase.from(kind).select("sort").order("sort", { ascending: false }).limit(1);
  const sort = (last?.[0]?.sort ?? -1) + 1;
  const { data, error } = await supabase.from(kind).insert({ ...toRow(kind, checked.value), sort }).select("*").single();
  if (error) return NextResponse.json({ error: "Failed to save", detail: dbDetail(error) }, { status: 500 });
  await audit("content_changed", `${kind}:create`, { id: data.id });
  revalidateContent();
  return NextResponse.json({ item: data });
}

// Reorder: { order: [id, id, ...] }
export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { kind } = await params;
  if (!isKind(kind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const order: unknown = body?.order;
  if (!Array.isArray(order) || order.length > 200 || !order.every((id) => typeof id === "string" && UUID.test(id))) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  const supabase = getSupabase()!;
  const results = await Promise.all(order.map((id: string, i: number) => supabase.from(kind).update({ sort: i }).eq("id", id)));
  if (results.some((r) => r.error)) return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  await audit("content_changed", `${kind}:reorder`);
  revalidateContent();
  return NextResponse.json({ success: true });
}
