import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { chunk, fetchAll } from "@/lib/paginate";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

const COLUMNS =
  "id, order_number, created_at, customer_name, phone, email, address, area, landmark, pincode, lat, lng, note, items, total, delivery_fee, slot, status";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const limit = Math.min(1000, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 200));
  const { data, error } = await supabase
    .from("orders")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json({ error: "Failed to load orders", detail: dbDetail(error as { message?: string }) }, { status: 500 });
  }

  // How often has each customer ordered before? Helps spot dummy orders.
  const phones = [...new Set(data.map((o) => o.phone))];
  const history: Record<string, { orders: number; delivered: number; cancelled: number }> = {};
  // In batches of 100 numbers so the request URL stays short. All at once.
  const [batches, { data: blocked }] = await Promise.all([
    Promise.all(
      chunk(phones, 100).map((batch) =>
        fetchAll<{ phone: string; status: string }>((from, to) =>
          supabase.from("orders").select("phone, status").in("phone", batch).order("id", { ascending: true }).range(from, to)
        )
      )
    ),
    supabase.from("blocked_phones").select("phone"),
  ]);
  for (const { data: all } of batches) {
    for (const row of all) {
      const h = (history[row.phone] ??= { orders: 0, delivered: 0, cancelled: 0 });
      h.orders++;
      if (row.status === "delivered") h.delivered++;
      if (row.status === "cancelled") h.cancelled++;
    }
  }

  return NextResponse.json({
    orders: data,
    history,
    blocked: (blocked ?? []).map((b) => b.phone),
  });
}
