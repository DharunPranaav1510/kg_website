import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { dbDetail } from "@/lib/db-error";
import { productMovement, type MovementOrder } from "@/lib/movement";
import { fetchAll } from "@/lib/paginate";
import { revalidateStorefront, rowToProduct } from "@/lib/products-db";
import { getSupabase } from "@/lib/supabase";

const DAYS = 30;

// Products with how much each sold in the last 30 days, for choosing what to put on offer.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const since = new Date(Date.now() - DAYS * 86400000).toISOString();

  const [{ data: products, error }, { data: orders, error: e2 }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    fetchAll<MovementOrder>((from, to) =>
      supabase
        .from("orders")
        .select("created_at, status, items")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
  ]);
  if (error || e2) {
    return NextResponse.json({ error: "Failed to load", detail: dbDetail((error ?? e2) as { message?: string }) }, { status: 500 });
  }
  const list = (products ?? []).map(rowToProduct);
  const movement = productMovement(orders, list);
  return NextResponse.json({
    days: DAYS,
    products: list.map((p) => ({ ...p, movement: movement[p.id] })),
  });
}

// Apply an offer to several products at once: { ids, percent | price, label, from, to }
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const body = await req.json().catch(() => null);

  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 200) : [];
  if (!ids.length) return NextResponse.json({ error: "Choose at least one product" }, { status: 400 });
  const percent = Number(body?.percent);
  if (!(percent >= 1 && percent <= 90)) return NextResponse.json({ error: "Enter a discount between 1% and 90%" }, { status: 400 });
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 30) : "";
  const from = typeof body?.from === "string" && body.from ? new Date(body.from) : null;
  const to = typeof body?.to === "string" && body.to ? new Date(body.to) : null;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return NextResponse.json({ error: "The dates are not valid" }, { status: 400 });
  if (to && to.getTime() < Date.now()) return NextResponse.json({ error: "The end time is in the past" }, { status: 400 });
  if (from && to && from > to) return NextResponse.json({ error: "The offer must end after it starts" }, { status: 400 });

  const { data: rows, error } = await supabase.from("products").select("id, name, price_per_kg").in("id", ids);
  if (error) return NextResponse.json({ error: "Failed to load products", detail: dbDetail(error) }, { status: 500 });

  const results = await Promise.all(
    (rows ?? []).map((r) =>
      supabase
        .from("products")
        .update({
          offer_price: Math.round(Number(r.price_per_kg) * (1 - percent / 100)),
          offer_label: label || `${percent}% off`,
          offer_from: from?.toISOString() ?? null,
          offer_to: to?.toISOString() ?? null,
        })
        .eq("id", r.id)
    )
  );
  if (results.some((r) => r.error)) return NextResponse.json({ error: "Some products could not be updated" }, { status: 500 });
  await audit("offers_changed", `${rows?.length ?? 0} products`, { percent, label, to: to?.toISOString() ?? null, names: (rows ?? []).map((r) => r.name).slice(0, 20) });
  revalidateStorefront();
  return NextResponse.json({ success: true, updated: rows?.length ?? 0 });
}

// Remove offers: { ids }
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 200) : [];
  if (!ids.length) return NextResponse.json({ error: "Choose at least one product" }, { status: 400 });
  const { error } = await getSupabase()!
    .from("products")
    .update({ offer_price: null, offer_label: null, offer_from: null, offer_to: null })
    .in("id", ids);
  if (error) return NextResponse.json({ error: "Failed to remove", detail: dbDetail(error) }, { status: 500 });
  await audit("offers_changed", `${ids.length} products`, { removed: true });
  revalidateStorefront();
  return NextResponse.json({ success: true });
}
