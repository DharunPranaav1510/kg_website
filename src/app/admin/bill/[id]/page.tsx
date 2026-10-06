import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getBusinessFresh } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";
import BillSheet from "./BillSheet";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The bill is its own page (no admin menu) so it prints cleanly. Admins only.
export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin || admin.mfaSetupRequired) redirect("/admin/login");
  const { id } = await params;
  const supabase = getSupabase();
  const { data: order } =
    supabase && UUID.test(id)
      ? await supabase
          .from("orders")
          .select("order_number, created_at, customer_name, phone, address, items, total, delivery_fee, subtotal, gst_total, gst_inclusive, slot, status")
          .eq("id", id)
          .maybeSingle()
      : { data: null };

  if (!order) {
    return <p className="p-10 text-center text-secondary-text">Order not found.</p>;
  }
  await audit("bill_printed", `#${order.order_number}`);
  const business = await getBusinessFresh();

  return (
    <BillSheet
      order={{
        order_number: order.order_number,
        created_at: order.created_at,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        slot: order.slot,
        status: order.status,
        items: order.items,
        total: Number(order.total),
        delivery_fee: Number(order.delivery_fee),
        subtotal: order.subtotal === null ? null : Number(order.subtotal),
        gst_total: order.gst_total === null ? null : Number(order.gst_total),
        gst_inclusive: order.gst_inclusive,
      }}
      shop={{
        name: business.name,
        legalName: business.legal.legalName,
        address: business.address.full,
        phone: business.contact.phoneDisplay,
        email: business.contact.email,
        gstin: business.legal.gstin,
        fssai: business.legal.fssai,
        website: business.website,
      }}
    />
  );
}
