"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { STATUS_LABEL } from "@/lib/delivery";
import { adminApi } from "../api";
import { STATUS_STYLE, formatAge, itemsSummary, type Order, type OrdersResponse } from "../orderUtils";

interface ProductLite {
  id: string;
  name: string;
  inStock?: boolean;
  active: boolean;
}

const sameDay = (iso: string, ref: Date) => new Date(iso).toDateString() === ref.toDateString();

export default function OverviewPanel() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [shop, setShop] = useState<{ open: boolean; message: string } | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const [o, p, s] = await Promise.all([
        adminApi("/api/admin/orders?limit=300") as Promise<OrdersResponse>,
        adminApi("/api/admin/products"),
        adminApi("/api/admin/shop"),
      ]);
      setOrders(o.orders);
      setProducts(p.products);
      setShop(s.shop);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOrders((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      setNow(Date.now());
      load();
    }, 30000);
    return () => clearInterval(t);
  }, [load]);

  const today = new Date(now);
  const yesterday = new Date(now - 86400000);
  const list = orders ?? [];
  const live = (o: Order) => o.status !== "cancelled";
  const todayOrders = list.filter((o) => live(o) && sameDay(o.created_at, today));
  const yesterdayOrders = list.filter((o) => live(o) && sameDay(o.created_at, yesterday));
  const sales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const salesYesterday = yesterdayOrders.reduce((s, o) => s + Number(o.total), 0);
  const waiting = list.filter((o) => o.status === "new").sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const latest = list[0];
  const soldOut = products.filter((p) => p.active && p.inStock === false);

  const delta =
    salesYesterday > 0 ? Math.round(((sales - salesYesterday) / salesYesterday) * 100) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl sm:text-3xl">
        {today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening"} 👋
      </h1>
      <p className="mb-5 text-sm text-secondary-text">
        {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {shop && !shop.open && (
        <Link href="/admin/settings" className="mb-5 block rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <b>The shop is closed.</b> Customers can browse but cannot place orders. Tap to change.
        </Link>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/admin/orders" className={`rounded-2xl border p-4 ${waiting.length ? "border-amber-300 bg-amber-50" : "border-warm-gray bg-white"}`}>
          <p className="text-xs text-secondary-text">Waiting for confirmation</p>
          <p className="font-display text-3xl">{waiting.length}</p>
          <p className="text-xs text-secondary-text">
            {waiting[0] ? `Oldest ${formatAge(now - new Date(waiting[0].created_at).getTime())}` : "All caught up 🎉"}
          </p>
        </Link>
        <div className="rounded-2xl border border-warm-gray bg-white p-4">
          <p className="text-xs text-secondary-text">Orders today</p>
          <p className="font-display text-3xl">{todayOrders.length}</p>
          <p className="text-xs text-secondary-text">Yesterday {yesterdayOrders.length}</p>
        </div>
        <Link href="/admin/sales" className="rounded-2xl border border-warm-gray bg-white p-4">
          <p className="text-xs text-secondary-text">Sales today</p>
          <p className="font-display text-3xl">₹{sales.toLocaleString("en-IN")}</p>
          <p className={`text-xs ${delta === null ? "text-secondary-text" : delta >= 0 ? "text-success" : "text-red-600"}`}>
            {delta === null ? "No sales yesterday" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs all of yesterday`}
          </p>
        </Link>
        <div className="rounded-2xl border border-warm-gray bg-white p-4">
          <p className="text-xs text-secondary-text">Last order</p>
          <p className="font-display text-3xl">{latest ? formatAge(now - new Date(latest.created_at).getTime()) : "—"}</p>
          <p className="truncate text-xs text-secondary-text">{latest ? `#${latest.order_number} · ${latest.customer_name}` : "No orders yet"}</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-warm-gray bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent orders</h2>
            <Link href="/admin/history" className="text-xs text-accent hover:underline">All orders →</Link>
          </div>
          {orders === null ? (
            <p className="text-sm text-secondary-text">Loading…</p>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-secondary-text">No orders yet. They will show up here.</p>
          ) : (
            <ul className="divide-y divide-warm-gray/70">
              {list.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="font-display">#{o.order_number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.customer_name}</p>
                    <p className="truncate text-xs text-secondary-text">{itemsSummary(o, 1)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  <b>₹{o.total}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-warm-gray bg-white p-4">
            <h2 className="mb-3 text-sm font-medium">Needs attention</h2>
            <ul className="space-y-2 text-sm">
              {waiting.length > 0 && (
                <li><Link href="/admin/orders" className="text-accent hover:underline">{waiting.length} order{waiting.length === 1 ? "" : "s"} waiting to be confirmed →</Link></li>
              )}
              {soldOut.length > 0 && (
                <li><Link href="/admin/prices" className="text-accent hover:underline">{soldOut.length} product{soldOut.length === 1 ? "" : "s"} marked sold out →</Link></li>
              )}
              {waiting.length === 0 && soldOut.length === 0 && <li className="text-secondary-text">Nothing needs your attention.</li>}
            </ul>
          </section>
          <section className="grid grid-cols-2 gap-3">
            {[
              ["/admin/prices", "Update prices"],
              ["/admin/products", "Add product"],
              ["/admin/sales", "Sales report"],
              ["/admin/settings", "Open / close shop"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-2xl border border-warm-gray bg-white px-4 py-3 text-sm font-medium hover:border-accent/40">
                {label}
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
