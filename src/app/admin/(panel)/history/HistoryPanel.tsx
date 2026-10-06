"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { formatPhone } from "@/lib/phone";
import { csvCell } from "@/lib/csv";
import { adminApi } from "../../api";
import {
  STATUS_STYLE,
  itemsSummary,
  printSlip,
  whatsappLink,
  type CustomerHistory,
  type Order,
  type OrdersResponse,
} from "../../orderUtils";
import { AddressBlock, BlockButton, ContactLines, CustomerBadge } from "../../OrderParts";

const RANGES = [
  { id: "today", label: "Today", days: 0 },
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "all", label: "All", days: null },
] as const;


function downloadCsv(rows: Order[]) {
  const head = ["Order #", "Placed", "Status", "Name", "Phone", "Email", "Address", "Slot", "Items", "Delivery fee", "Total", "Note"];
  const lines = rows.map((o) =>
    [
      o.order_number,
      new Date(o.created_at).toLocaleString("en-IN"),
      STATUS_LABEL[o.status],
      o.customer_name,
      o.phone,
      o.email ?? "",
      o.address,
      o.slot ?? "",
      o.items.map((i) => `${i.name} ${i.quantity}`).join("; "),
      o.delivery_fee,
      o.total,
      o.note ?? "",
    ].map(csvCell).join(",")
  );
  const blob = new Blob([[head.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `kg-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function HistoryPanel() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [history, setHistory] = useState<Record<string, CustomerHistory>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = (await adminApi("/api/admin/orders?limit=1000")) as OrdersResponse;
      setOrders(r.orders);
      setHistory(r.history);
      setBlocked(r.blocked);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOrders((p) => p ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setOrderStatus(o: Order, next: OrderStatus) {
    try {
      await adminApi(`/api/admin/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace("#", "");
    const days = RANGES.find((r) => r.id === range)!.days;
    const from = days === null ? 0 : new Date().setHours(0, 0, 0, 0) - days * 86400000;
    return (orders ?? []).filter(
      (o) =>
        (status === "all" || o.status === status) &&
        new Date(o.created_at).getTime() >= from &&
        (!q ||
          String(o.order_number) === q ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone.includes(q.replace(/\s/g, "")) ||
          (o.email ?? "").toLowerCase().includes(q))
    );
  }, [orders, status, range, query]);

  const total = shown.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const chip = (on: boolean) =>
    `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium ${
      on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"
    }`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Order history</h1>
          <p className="text-sm text-secondary-text">
            {shown.length} order{shown.length === 1 ? "" : "s"} · ₹{total.toLocaleString("en-IN")} (excluding cancelled)
          </p>
        </div>
        <button onClick={() => downloadCsv(shown)} disabled={shown.length === 0} className="btn-secondary !py-2 !px-4 !text-xs disabled:opacity-50">
          ⬇ Download CSV
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, email or #order…"
          className="min-w-[14rem] flex-1 rounded-full border border-warm-gray bg-white px-4 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="mb-2 flex gap-1.5 overflow-x-auto">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={chip(range === r.id)}>{r.label}</button>
        ))}
        <span className="mx-1 w-px bg-warm-gray" />
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={chip(status === s)}>
            {s === "all" ? "Any status" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <p className="my-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {orders === null ? (
        <p className="mt-6 text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-warm-gray bg-white p-8 text-center text-secondary-text">No orders match.</p>
      ) : (
        <ul className="mt-3 divide-y divide-warm-gray overflow-hidden rounded-2xl border border-warm-gray bg-white">
          {shown.map((o) => {
            const expanded = open === o.id;
            return (
              <li key={o.id}>
                <button onClick={() => setOpen(expanded ? null : o.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cream/50" aria-expanded={expanded}>
                  <span className="w-12 font-display">#{o.order_number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{o.customer_name} <span className="font-normal text-secondary-text">· {formatPhone(o.phone)}</span></span>
                    <span className="block truncate text-xs text-secondary-text">
                      {new Date(o.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {itemsSummary(o, 1)}
                    </span>
                  </span>
                  <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  <b className="text-sm">₹{o.total}</b>
                </button>
                {expanded && (
                  <div className="space-y-3 bg-cream/40 px-4 pb-4 pt-2 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2"><ContactLines o={o} /><CustomerBadge history={history[o.phone]} blocked={blocked.includes(o.phone)} /></div>
                      <AddressBlock o={o} />
                    </div>
                    {o.note && <p className="italic">“{o.note}”</p>}
                    <ul className="divide-y divide-warm-gray/70 rounded-xl border border-warm-gray bg-white px-3">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between py-1.5"><span>{it.name} <span className="text-secondary-text">· {it.quantity}</span></span><span>₹{it.price}</span></li>
                      ))}
                    </ul>
                    <p className="text-xs text-secondary-text">Delivery {Number(o.delivery_fee) ? `₹${o.delivery_fee}` : "free"}{o.slot ? ` · ${o.slot}` : ""} · cash on delivery</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={o.status}
                        onChange={(e) => setOrderStatus(o, e.target.value as OrderStatus)}
                        className="rounded-full border border-warm-gray bg-white px-3 py-1.5 text-xs"
                        aria-label="Change status"
                      >
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                      <a href={whatsappLink(o)} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 !px-3 !text-xs">WhatsApp</a>
                      <button onClick={() => printSlip(o)} className="btn-secondary !py-1.5 !px-3 !text-xs" title="Small slip for the kitchen or delivery boy">Print slip</button>
                      <a href={`/admin/bill/${o.id}`} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 !px-3 !text-xs" title="Customer bill with GST details">Print bill</a>
                      <span className="ml-auto"><BlockButton phone={o.phone} blocked={blocked.includes(o.phone)} onChanged={load} /></span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
