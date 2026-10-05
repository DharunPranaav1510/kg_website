import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getShopStatusFresh } from "@/lib/settings";

// Tiny payload polled by the admin sidebar (badge + open/closed switch).
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const [{ count }, shop] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    getShopStatusFresh(),
  ]);
  return NextResponse.json({ newOrders: count ?? 0, shop });
}
