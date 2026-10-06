"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";

export const ORDERS_KEY = "kg-foods-orders";
export interface SavedOrder { id: string; number: number; total: number; at: number }

export function rememberOrder(o: SavedOrder) {
  try {
    const list: SavedOrder[] = JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? "[]");
    const next = [o, ...list.filter((x) => x.id !== o.id)].slice(0, 10);
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  } catch {
    /* private mode: fine */
  }
}

const when = (t: number) =>
  new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function MyOrders() {
  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  useEffect(() => {
    try {
      const list = JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? "[]");
      setOrders(Array.isArray(list) ? list.filter((o) => o?.id && o?.number) : []);
    } catch {
      setOrders([]);
    }
  }, []);
  if (!orders?.length) return null;
  return (
    <section aria-label="Orders on this phone" className="mb-6">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-text">On this phone</h2>
      <ul className="overflow-hidden rounded-2xl border border-warm-gray/70 bg-white shadow-soft">
        {orders.map((o) => (
          <li key={o.id} className="border-b border-warm-gray/60 last:border-0">
            <Link href={`/order/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-warm-gray/50">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent"><ReceiptText size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-primary-text">Order #{o.number}</span>
                <span className="block text-xs text-secondary-text">{when(o.at)} · ₹{o.total}</span>
              </span>
              <ChevronRight size={18} className="text-secondary-text" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
