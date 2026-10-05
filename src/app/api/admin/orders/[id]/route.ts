import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";
import { ORDER_STATUSES } from "@/lib/delivery";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: before } = await supabase.from("orders").select("order_number, status").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (before && before.status !== status) {
    await audit("order_status", `#${before.order_number}`, { changes: [{ name: `#${before.order_number}`, from: before.status, to: status }] });
  }
  return NextResponse.json({ order: data });
}
