import { NextResponse } from "next/server";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { isOwner } from "@/lib/owner";
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
  // Only the owner is told how many people are waiting for admin access.
  let adminRequests = 0;
  if (isOwner((await getAdmin())?.email)) {
    const { count: waiting } = await supabase.from("admin_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    adminRequests = waiting ?? 0;
  }
  return NextResponse.json({ newOrders: count ?? 0, shop, hours: business.hours.schedule, adminRequests });
}
