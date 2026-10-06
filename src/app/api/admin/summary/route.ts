import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getBusinessFresh } from "@/lib/content";
import { getShopStatusFresh } from "@/lib/settings";

// Tiny payload polled by the admin sidebar (badge + open/closed switch).
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const [{ count }, shop, business] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    getShopStatusFresh(),
    getBusinessFresh(),
  ]);
  return NextResponse.json({ newOrders: count ?? 0, shop, hours: business.hours.schedule });
}
