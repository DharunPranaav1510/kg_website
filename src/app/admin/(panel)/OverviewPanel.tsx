"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { STATUS_LABEL } from "@/lib/delivery";
import { shopNow, type OpeningHours } from "@/lib/hours";
import { adminApi } from "../api";
import { usePoll } from "../usePoll";
import { useOrderActions } from "../orderActions";
import OrderPanel from "../OrderPanel";
import { SHOP_CHANGED_EVENT, rupees, useUi } from "../ui";
import { useForceOpen } from "../shopActions";
import { STATUS_STYLE, WAIT_LIMITS, formatAge, itemsSummary, type CustomerHistory, type Order, type OrdersResponse } from "../orderUtils";

interface ProductLite {
  id: string;
  name: string;
  inStock?: boolean;
  active: boolean;
}

const sameDay = (iso: string, ref: Date) => new Date(iso).toDateString() === ref.toDateString();

export default function OverviewPanel() {
  const { toast } = useUi();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [history, setHistory] = useState<Record<string, CustomerHistory>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [shop, setShop] = useState<{ open: boolean; message: string; forceOpenUntil?: number } | null>(null);
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [openId, setOpenId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, p, s] = await Promise.all([
        adminApi("/api/admin/orders?limit=300") as Promise<OrdersResponse>,
        adminApi("/api/admin/products"),
        adminApi("/api/admin/summary"),
      ]);
      setOrders(o.orders);
      setHistory(o.history);
      setBlocked(o.blocked);
      setProducts(p.products);
      setShop(s.shop);
      setHours(s.hours);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOrders((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  usePoll(() => {
    setNow(Date.now());
    load();
  }, 45000);

  const { changeStatus, block, unblock } = useOrderActions(setOrders, load);

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
  const openOrder = openId ? list.find((o) => o.id === openId) ?? null : null;

  const status = shop && hours ? shopNow(hours, shop) : null;
  const waitMins = waiting[0] ? (now - new Date(waiting[0].created_at).getTime()) / 60000 : 0;
  const [warn, late] = WAIT_LIMITS.new ?? [5, 10];
  const waitTone = !waiting[0] ? "border-warm-gray bg-white" : waitMins >= late ? "border-red-300 bg-red-50" : waitMins >= warn ? "border-amber-300 bg-amber-50" : "border-warm-gray bg-white";
  const ofYesterday = salesYesterday > 0 ? Math.round((sales / salesYesterday) * 100) : null;

  const force = useForceOpen(shop?.message ?? "", hours, load);

  async function resume() {
    if (!shop) return;
    setResuming(true);
    try {
      await adminApi("/api/admin/shop", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ open: true, message: shop.message }) });
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
      toast({ text: "Orders resumed." });
      await load();
    } catch (e) {
      toast({ text: `Could not resume orders. ${(e as Error).message}`, tone: "error", retry: resume });
    }
    setResuming(false);
  }

  async function backInStock(p: ProductLite) {
    setProducts((all) => all.map((x) => (x.id === p.id ? { ...x, inStock: true } : x)));
    try {
      await adminApi(`/api/admin/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inStock: true }) });
      toast({
        text: `${p.name} is back in stock.`,
        undo: async () => {
          await adminApi(`/api/admin/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inStock: false }) });
          await load();
        },
      });
    } catch (e) {
      setProducts((all) => all.map((x) => (x.id === p.id ? { ...x, inStock: false } : x)));
      toast({ text: `${p.name} was not changed. ${(e as Error).message}`, tone: "error", retry: () => backInStock(p) });
    }
  }

  const tile = "rounded-2xl border p-4";
  const small = "text-sm text-secondary-text";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 font-display text-2xl sm:text-3xl">Today</h1>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {/* 1. Status banner, only when closed or paused */}
      {status && !status.open &&
        (status.reason === "paused" ? (
          <section className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900">
            <p className="min-w-[14rem] flex-1 text-base">
              <b>Orders are paused.</b> Customers see: “{shop?.message || "Orders are paused right now. Please check back soon."}”
            </p>
            <button onClick={resume} disabled={resuming} className="btn-primary min-h-12 !text-base disabled:opacity-60">{resuming ? "Resuming…" : "Resume orders"}</button>
          </section>
        ) : (
          <section className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-warm-gray bg-gray-100 p-4 text-secondary-text">
            <p className="min-w-[14rem] flex-1 text-base">
              <b>Shop is closed</b>{status.opensLabel ? `, opens ${status.opensLabel}` : ""}. Customers can browse but cannot order. <Link href="/admin/settings" className="text-accent hover:underline">Opening hours →</Link>
            </p>
            <button onClick={() => force.run(true)} disabled={force.busy} className="min-h-12 rounded-full bg-success px-6 text-base font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {force.busy ? "Working…" : `Open until ${force.until}`}
            </button>
          </section>
        ))}
      {status?.open && status.extended && (
        <section className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
          <p className="min-w-[14rem] flex-1 text-base"><b>Open late.</b> Customers can order until {status.closesAt}. After that the usual hours apply again.</p>
          <button onClick={() => force.run(false)} disabled={force.busy} className="min-h-12 rounded-full border border-warm-gray bg-white px-6 text-base font-semibold hover:bg-cream disabled:opacity-60">Close the shop now</button>
        </section>
      )}

      {/* 2. Needs attention */}
      <section className="mb-5 rounded-2xl border border-warm-gray bg-white p-4">
        <h2 className="mb-2 font-body text-lg font-semibold">Needs attention</h2>
        <ul className="divide-y divide-warm-gray/70">
          {waiting.length > 0 && (
            <li className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-[12rem] flex-1 text-base">
                <b>{waiting.length} order{waiting.length === 1 ? "" : "s"}</b> waiting to be confirmed · oldest {formatAge(now - new Date(waiting[0].created_at).getTime())}
              </span>
              <Link href="/admin/orders" className="btn-primary min-h-12 !text-base">Open live orders</Link>
            </li>
          )}
          {soldOut.slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <span className="flex-1 text-base">Sold out: <b>{p.name}</b></span>
              <button role="switch" aria-checked={false} onClick={() => backInStock(p)} className="flex min-h-12 items-center gap-2 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream">
                Back in stock
              </button>
            </li>
          ))}
          {soldOut.length > 6 && (
            <li className="py-2"><Link href="/admin/prices" className="text-base text-accent hover:underline">and {soldOut.length - 6} more sold out →</Link></li>
          )}
          {waiting.length === 0 && soldOut.length === 0 && <li className="py-2 text-base text-secondary-text">Nothing needs you right now.</li>}
        </ul>
      </section>

      {/* 3. Four tiles */}
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/admin/orders" className={`${tile} ${waitTone}`}>
          <p className={small}>Waiting for confirmation</p>
          <p className="font-display text-3xl tabular-nums">{waiting.length}</p>
          <p className={small}>{waiting[0] ? `Oldest ${formatAge(now - new Date(waiting[0].created_at).getTime())}` : "All caught up"}</p>
        </Link>
        <Link href="/admin/history" className={`${tile} border-warm-gray bg-white`}>
          <p className={small}>Orders today</p>
          <p className="font-display text-3xl tabular-nums">{todayOrders.length}</p>
          <p className={small}>
            {todayOrders.length === yesterdayOrders.length ? "Same as yesterday" : `${todayOrders.length > yesterdayOrders.length ? "+" : "−"}${Math.abs(todayOrders.length - yesterdayOrders.length)} vs yesterday (${yesterdayOrders.length})`}
          </p>
        </Link>
        <Link href="/admin/sales" className={`${tile} border-warm-gray bg-white`}>
          <p className={small}>Sales today</p>
          <p className="font-display text-3xl tabular-nums">{rupees(sales)}</p>
          <p className={small}>{ofYesterday === null ? "No sales yesterday" : `${ofYesterday}% of yesterday's total`}</p>
        </Link>
        <Link href="/admin/orders" className={`${tile} border-warm-gray bg-white`}>
          <p className={small}>Last order</p>
          <p className="font-display text-3xl">{latest ? formatAge(now - new Date(latest.created_at).getTime()) : "—"}</p>
          <p className={`truncate ${small}`}>{latest ? `#${latest.order_number} · ${latest.customer_name}` : "No orders yet"}</p>
        </Link>
      </section>

      {/* 4. Recent orders */}
      <section className="mb-5 rounded-2xl border border-warm-gray bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-body text-lg font-semibold">Recent orders</h2>
          <Link href="/admin/history" className="flex min-h-12 items-center text-base text-accent hover:underline">All orders →</Link>
        </div>
        {orders === null ? (
          <p className="text-base text-secondary-text">Loading…</p>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-base text-secondary-text">No orders yet. They will show up here.</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {list.slice(0, 8).map((o) => (
              <li key={o.id}>
                <button onClick={() => setOpenId(o.id)} className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-base">
                  <span className="w-14 font-display font-bold">#{o.order_number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.customer_name}</span>
                    <span className="block truncate text-sm text-secondary-text">{itemsSummary(o, 1)}</span>
                  </span>
                  <span className={`hidden rounded-full px-2.5 py-0.5 text-sm font-semibold sm:inline ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  <span className="text-right">
                    <b className="block tabular-nums">{rupees(Number(o.total))}</b>
                    <span className="block text-sm text-secondary-text">{formatAge(now - new Date(o.created_at).getTime())}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. Quick links */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["/admin/prices", "Update prices"],
          ["/admin/products", "Products"],
          ["/admin/offers", "Offers"],
          ["/admin/sales", "Sales"],
          ["/admin/settings", "Shop settings"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="flex min-h-12 items-center justify-center rounded-2xl border border-warm-gray bg-white px-4 text-base font-medium hover:border-accent/40">
            {label}
          </Link>
        ))}
      </section>

      <OrderPanel
        order={openOrder}
        history={history}
        blocked={blocked}
        now={now}
        onClose={() => setOpenId(null)}
        onStatus={(o, st) => changeStatus(o, st)}
        onBlock={block}
        onUnblock={unblock}
      />
    </div>
  );
}
