"use client";

import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import { STATUS_STYLE, STATUS_TEXT } from "./orderStatus";
import { useSavedOrders } from "./useSavedOrders";

const when = (t?: number) =>
  t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

export default function MyOrders() {
  const { orders, status } = useSavedOrders();
  if (!orders?.length) return null;
  return (
    <section aria-label="Orders on this phone" className="mb-6">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-text">Your orders</h2>
      <ul className="overflow-hidden rounded-2xl border border-warm-gray/70 bg-white shadow-soft">
        {orders.map((o) => {
          const s = status[o.id];
          return (
            <li key={o.id} className="border-b border-warm-gray/60 last:border-0">
              <Link href={`/order/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-warm-gray/50">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><ReceiptText size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-primary-text">Order #{o.number}</span>
                  <span className="block truncate text-xs text-secondary-text">{[when(o.at), o.total ? `₹${o.total}` : ""].filter(Boolean).join(" · ") || "Tap to view"}</span>
                </span>
                {s && <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[s]}`}>{STATUS_TEXT[s]}</span>}
                <ChevronRight size={18} className="flex-shrink-0 text-secondary-text" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
