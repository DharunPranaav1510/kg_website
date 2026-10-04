"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { adminApi } from "./api";
import {
  NEXT,
  NEXT_LABEL,
  STATUS_STYLE,
  printSlip,
  timeAgo,
  whatsappLink,
  type Order,
} from "./orderUtils";

const POLL_MS = 20000;

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
