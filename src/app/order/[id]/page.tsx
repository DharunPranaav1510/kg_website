import type { Metadata } from "next";
import Link from "next/link";
import { Check, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { business } from "@/data/business";
import { getSupabase } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/delivery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Track your order — KG Foods",
  robots: { index: false, follow: false },
};

const STEPS: OrderStatus[] = ["new", "confirmed", "out_for_delivery", "delivered"];
const CUSTOMER_LABEL: Record<OrderStatus, string> = {
  new: "Order received",
  confirmed: "Confirmed by the shop",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const HEADLINE: Record<OrderStatus, string> = {
  new: "we've received your order",
  confirmed: "your order is confirmed",
  out_for_delivery: "your order is on its way",
  delivered: "your order was delivered",
  cancelled: "your order was cancelled",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderItem {
  name: string;
  quantity: string;
  price: number;
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data: order } =
    supabase && UUID.test(id)
      ? await supabase
          .from("orders")
          .select("order_number, created_at, customer_name, items, total, delivery_fee, slot, status")
          .eq("id", id)
          .maybeSingle()
      : { data: null };

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 px-4 min-h-[70vh]">
        <div className="max-w-xl mx-auto">
          {!order ? (
            <div className="text-center bg-white rounded-2xl border border-warm-gray p-8">
              <h1 className="font-display text-2xl mb-2">Order not found</h1>
              <p className="text-secondary-text text-sm mb-6">
                Check the link you were given, or call us and we&apos;ll help.
              </p>
              <Link href="/shop" className="btn-primary">Back to shop</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-warm-gray shadow-soft p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">
                Order #{order.order_number}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl mt-1">
                {`Hi ${String(order.customer_name).split(" ")[0]}, ${HEADLINE[order.status as OrderStatus] ?? order.status}`}
              </h1>

              {order.status === "new" && (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">⚠ Not confirmed yet</p>
                  <p className="mt-1">
                    Your order is confirmed only when someone from {business.name} calls you. Please keep your phone nearby. This page updates when we confirm.
                  </p>
                </div>
              )}

              {order.status !== "cancelled" && (
                <ol className="mt-6 space-y-4">
                  {STEPS.map((step, i) => {
                    const current = STEPS.indexOf(order.status as OrderStatus);
                    const done = i <= current;
                    return (
                      <li key={step} className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            done ? "bg-success text-white" : "bg-warm-gray text-secondary-text"
                          }`}
                        >
                          {done ? <Check size={14} /> : i + 1}
                        </span>
                        <span className={done ? "font-medium text-primary-text" : "text-secondary-text"}>
                          {CUSTOMER_LABEL[step]}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="mt-8 border-t border-warm-gray pt-5 space-y-2 text-sm">
                {(order.items as OrderItem[]).map((it, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <span>{it.name} <span className="text-secondary-text">· {it.quantity}</span></span>
                    <span>₹{it.price}</span>
                  </div>
                ))}
                <div className="flex justify-between text-secondary-text">
                  <span>Delivery</span>
                  <span>{Number(order.delivery_fee) ? `₹${order.delivery_fee}` : "Free"}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-warm-gray">
                  <span>Total (pay on delivery)</span>
                  <span>₹{order.total}</span>
                </div>
                {order.slot && <p className="text-secondary-text pt-1">Delivery slot: {order.slot}</p>}
              </div>

              <a
                href={`tel:${business.contact.phone}`}
                className="mt-6 flex items-center justify-center gap-2 btn-secondary w-full"
              >
                <Phone size={15} /> Call the shop · {business.contact.phoneDisplay}
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
