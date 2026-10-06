import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await getSupabase()!
    .from("order_feedback")
    .select("id, rating, comment, created_at, orders(id, order_number, customer_name, phone, items)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: "Failed to load feedback", detail: dbDetail(error) }, { status: 500 });

  type Joined = { id: string; order_number: number; customer_name: string; phone: string; items: { name: string }[] };
  const rows = (data ?? []).map((r) => {
    const o = (Array.isArray(r.orders) ? r.orders[0] : r.orders) as Joined | null;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      order: o ? { id: o.id, number: o.order_number, name: o.customer_name, phone: o.phone, items: (o.items ?? []).map((i) => i.name) } : null,
    };
  });
  const count = rows.length;
  const average = count ? rows.reduce((n, r) => n + r.rating, 0) / count : 0;
  const spread = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rows.filter((r) => r.rating === stars).length }));
  return NextResponse.json({ feedback: rows, summary: { count, average, spread } });
}
