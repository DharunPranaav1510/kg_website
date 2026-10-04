import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, created_at, customer_name, phone, address, note, items, total, delivery_fee, slot, status")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
  return NextResponse.json({ orders: data });
}
