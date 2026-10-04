"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { business } from "@/data/business";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  whatsappNumber,
  type OrderStatus,
} from "@/lib/delivery";
import { adminApi } from "./api";

interface Order {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string | null;
  items: { name: string; quantity: string; price: number }[];
  total: number;
  delivery_fee: number;
  slot: string | null;
  status: OrderStatus;
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "confirmed",
  confirmed: "out_for_delivery",
  out_for_delivery: "delivered",
};
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Confirm order",
  confirmed: "Out for delivery",
  out_for_delivery: "Mark delivered",
};
const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  out_for_delivery: "bg-violet-100 text-violet-800",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-red-100 text-red-700",
};

const POLL_MS = 20000;

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function whatsappLink(o: Order) {
  const msg =
    o.status === "out_for_delivery"
      ? `Hi ${o.customer_name}, your ${business.name} order #${o.order_number} is out for delivery.`
      : o.status === "delivered"
        ? `Hi ${o.customer_name}, thanks for ordering from ${business.name}! Order #${o.order_number} is delivered.`
        : `Hi ${o.customer_name}, this is ${business.name} about your order #${o.order_number} (₹${o.total}).`;
  return `https://wa.me/${whatsappNumber(o.phone)}?text=${encodeURIComponent(msg)}`;
}

function printSlip(o: Order) {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  w.document.write(`<!doctype html><title>Order #${o.order_number}</title>
    <body style="font:14px monospace;width:300px;margin:8px">
    <h3 style="margin:0">${esc(business.name)}</h3>
    <div>Order #${o.order_number} · ${new Date(o.created_at).toLocaleString("en-IN")}</div><hr>
    <div><b>${esc(o.customer_name)}</b><br>${esc(o.phone)}<br>${esc(o.address)}</div>
    ${o.slot ? `<div>Slot: ${esc(o.slot)}</div>` : ""}${o.note ? `<div>Note: ${esc(o.note)}</div>` : ""}<hr>
    ${o.items.map((i) => `<div>${esc(i.name)} — ${esc(i.quantity)} <span style="float:right">₹${i.price}</span></div>`).join("")}<hr>
    <div>Delivery <span style="float:right">${Number(o.delivery_fee) ? "₹" + o.delivery_fee : "Free"}</span></div>
    <div><b>TOTAL (COD) <span style="float:right">₹${o.total}</span></b></div>
    <script>window.print()</script></body>`);
  w.document.close();
}

export default function OrdersPanel({ onNewCount }: { onNewCount: (n: number) => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<"active" | OrderStatus | "all">("active");
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const knownMax = useRef<number | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    const ctx = audio.current;
    if (!ctx) return;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.2);
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const { orders: list } = (await adminApi("/api/admin/orders")) as { orders: Order[] };
      setOrders(list);
      setError("");
      const max = list.reduce((m, o) => Math.max(m, o.order_number), 0);
      if (knownMax.current !== null && max > knownMax.current) beep();
      knownMax.current = max;
      onNewCount(list.filter((o) => o.status === "new").length);
    } catch (e) {
      setError((e as Error).message);
      setOrders((prev) => prev ?? []);
    }
  }, [beep, onNewCount]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(o: Order, status: OrderStatus) {
    if (status === "cancelled" && !window.confirm(`Cancel order #${o.order_number}?`)) return;
    try {
      await adminApi(`/api/admin/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggleSound() {
    if (!sound) {
      audio.current ??= new AudioContext();
      audio.current.resume();
      beep();
    }
    setSound(!sound);
  }

  const shown = (orders ?? []).filter((o) =>
    filter === "all" ? true : filter === "active" ? !["delivered", "cancelled"].includes(o.status) : o.status === filter
  );
  const today = (orders ?? []).filter(
    (o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-warm-gray p-4">
          <p className="text-xs text-secondary-text">Orders today</p>
          <p className="font-display text-2xl">{today.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-warm-gray p-4">
          <p className="text-xs text-secondary-text">Sales today</p>
          <p className="font-display text-2xl">₹{today.reduce((s, o) => s + Number(o.total), 0)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["active", ...ORDER_STATUSES, "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${
              filter === f ? "bg-primary-text text-white border-primary-text" : "bg-white border-warm-gray text-secondary-text"
            }`}
          >
            {f === "active" ? "Active" : f === "all" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
        <button onClick={toggleSound} className="ml-auto text-xs text-secondary-text hover:text-primary-text">
          {sound ? "🔔 New-order sound on" : "🔕 Turn on new-order sound"}
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>}

      {orders === null ? (
        <p className="text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="bg-white rounded-2xl border border-warm-gray p-8 text-center text-secondary-text">
          No orders here yet. This page refreshes by itself every 20 seconds.
        </p>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => (
            <article key={o.id} className="bg-white rounded-2xl border border-warm-gray p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-display text-lg">#{o.order_number}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <span className="text-xs text-secondary-text ml-auto">{timeAgo(o.created_at)}</span>
              </div>
              <p className="font-medium">
                {o.customer_name} ·{" "}
                <a href={`tel:${o.phone}`} className="text-accent hover:underline">{o.phone}</a>
              </p>
              <p className="text-sm text-secondary-text">{o.address}</p>
              {o.slot && <p className="text-sm mt-1">🕒 {o.slot}</p>}
              {o.note && <p className="text-sm mt-1 italic">“{o.note}”</p>}

              <ul className="mt-3 text-sm divide-y divide-warm-gray/70 border-y border-warm-gray/70">
                {o.items.map((it, i) => (
                  <li key={i} className="flex justify-between py-1.5">
                    <span>{it.name} <span className="text-secondary-text">· {it.quantity}</span></span>
                    <span>₹{it.price}</span>
                  </li>
                ))}
              </ul>
              <p className="flex justify-between text-sm mt-2">
                <span className="text-secondary-text">Delivery {Number(o.delivery_fee) ? `₹${o.delivery_fee}` : "free"} · pay on delivery</span>
                <b className="text-base">₹{o.total}</b>
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {NEXT[o.status] && (
                  <button onClick={() => setStatus(o, NEXT[o.status]!)} className="btn-primary !py-2 !px-4 !text-xs">
                    {NEXT_LABEL[o.status]}
                  </button>
                )}
                <a href={whatsappLink(o)} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 !px-4 !text-xs">
                  WhatsApp
                </a>
                <button onClick={() => printSlip(o)} className="btn-secondary !py-2 !px-4 !text-xs">Print</button>
                {o.status !== "cancelled" && o.status !== "delivered" && (
                  <button onClick={() => setStatus(o, "cancelled")} className="text-xs text-red-600 hover:underline ml-auto">
                    Cancel
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
