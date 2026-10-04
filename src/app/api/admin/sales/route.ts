import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { buildSalesReport, RANGE_IDS, resolveRange, type RangeId, type SalesOrder } from "@/lib/sales";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const param = new URL(req.url).searchParams.get("range") ?? "7d";
  const id = (RANGE_IDS as readonly string[]).includes(param) ? (param as RangeId) : "7d";
  const window = resolveRange(id, Date.now());

  const [{ data: orders, error }, { data: earlier }, { data: products }] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, total, delivery_fee, status, phone, slot, items")
      .gte("created_at", new Date(window.prevFrom).toISOString())
      .lte("created_at", new Date(window.to).toISOString())
      .order("created_at", { ascending: true })
      .limit(20000),
    supabase
      .from("orders")
      .select("phone")
      .lt("created_at", new Date(window.from).toISOString())
      .neq("status", "cancelled")
      .limit(50000),
    supabase.from("products").select("id, name, category"),
  ]);
  if (error) {
    console.error("Admin sales fetch error:", error);
    return NextResponse.json({ error: "Failed to load sales" }, { status: 500 });
  }

  const all = (orders ?? []) as SalesOrder[];
  const current = all.filter((o) => new Date(o.created_at).getTime() >= window.from);
  const previous = all.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= window.prevFrom && t <= window.prevTo;
  });

  const byId = new Map((products ?? []).map((p) => [p.id, p.category as string]));
  const byName = new Map((products ?? []).map((p) => [p.name, p.category as string]));
  const report = buildSalesReport(
    window,
    current,
    previous,
    new Set((earlier ?? []).map((r) => r.phone as string)),
    (item) => item.category ?? (item.id && byId.get(item.id)) ?? byName.get(item.name) ?? "Other"
  );
  return NextResponse.json({ report });
}
