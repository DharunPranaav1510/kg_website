"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { formatPhone } from "@/lib/phone";
import { csvCell } from "@/lib/csv";
import { adminApi } from "../../api";
import { useOrderActions } from "../../orderActions";
import OrderPanel from "../../OrderPanel";
import { MoreMenu, clock, dayDate, rupees } from "../../ui";
import {
  STATUS_STYLE,
  itemsSummary,
  printSlip,
  type CustomerHistory,
  type Order,
  type OrdersResponse,
} from "../../orderUtils";

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
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const r = (await adminApi("/api/admin/orders?limit=1000")) as OrdersResponse;
      setOrders(r.orders);
      setHistory(r.history);
      setBlocked(r.blocked);
      setNow(Date.now());
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOrders((p) => p ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const { changeStatus, block, unblock } = useOrderActions(setOrders, load);

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
    `min-h-12 whitespace-nowrap rounded-full border px-4 text-base font-medium ${
      on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"
    }`;
  const openOrder = openId ? (orders ?? []).find((o) => o.id === openId) ?? null : null;

  const statusSelect = (o: Order) => (
    <select
      value={o.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
      aria-label={`Change status of order ${o.order_number}`}
      className={`min-h-12 rounded-full border-0 px-3 text-base font-semibold ${STATUS_STYLE[o.status]}`}
    >
      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  );
  const rowMenu = (o: Order) => (
    <MoreMenu
      items={[
        { label: "Print slip", onSelect: () => printSlip(o) },
        { label: "Print bill", href: `/admin/bill/${o.id}` },
        { label: blocked.includes(o.phone) ? "Unblock this phone number" : "Block this phone number", onSelect: () => (blocked.includes(o.phone) ? unblock(o.phone) : block(o.phone)), danger: true },
      ]}
    />
  );
  const widen = RANGES[Math.min(RANGES.findIndex((r) => r.id === range) + 1, RANGES.length - 1)];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Order history</h1>
          <p className="text-base text-secondary-text">
            {shown.length} order{shown.length === 1 ? "" : "s"} · {rupees(total)} (excluding cancelled)
          </p>
        </div>
        <button onClick={() => downloadCsv(shown)} disabled={shown.length === 0} className="min-h-12 rounded-full border border-warm-gray bg-white px-5 text-base font-medium hover:bg-cream disabled:opacity-50">
          Download CSV
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} aria-pressed={range === r.id} className={chip(range === r.id)}>{r.label}</button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, phone, email or order number"
          aria-label="Search orders"
          className="min-h-12 min-w-[14rem] flex-1 rounded-full border border-warm-gray bg-white px-4 text-base outline-none focus:border-accent"
        />
      </div>
      <div className="mb-2 flex gap-2 overflow-x-auto" role="group" aria-label="Status">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={chip(status === s)}>
            {s === "all" ? "Any status" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <p className="my-3 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {orders === null ? (
        <p className="mt-6 text-base text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-warm-gray bg-white p-8 text-center">
          <p className="text-base text-secondary-text">
            No orders match{query.trim() ? ` “${query.trim()}”` : ""} {range === "all" ? "" : `in ${RANGES.find((r) => r.id === range)!.label.toLowerCase()}`}.
          </p>
          {range !== "all" && <button onClick={() => setRange(widen.id)} className="btn-primary mt-4 min-h-12 !text-base">Try {widen.label.toLowerCase()}</button>}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-3 hidden overflow-hidden rounded-2xl border border-warm-gray bg-white md:block">
            <table className="w-full text-left text-base">
              <thead className="bg-cream text-sm text-secondary-text">
                <tr>
                  {["Order", "Date and time", "Customer", "Phone", "Total", "Time slot", "Status", ""].map((h) => (
                    <th key={h} scope="col" className="px-3 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-gray/70">
                {shown.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-cream/50">
                    <td className="px-3 py-2 font-display font-bold">#{o.order_number}</td>
                    <td className="px-3 py-2 text-secondary-text">{dayDate(o.created_at)}<br />{clock(o.created_at)}</td>
                    <td className="max-w-[12rem] px-3 py-2"><span className="block truncate font-medium">{o.customer_name}</span><span className="block truncate text-sm text-secondary-text">{itemsSummary(o, 1)}</span></td>
                    <td className="px-3 py-2 tabular-nums">{formatPhone(o.phone)}</td>
                    <td className="px-3 py-2 font-semibold tabular-nums">{rupees(Number(o.total))}</td>
                    <td className="px-3 py-2 text-secondary-text">{o.slot ? o.slot.split(" (")[0] : "—"}</td>
                    <td className="px-3 py-2">{statusSelect(o)}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>{rowMenu(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone cards */}
          <ul className="mt-3 space-y-2 md:hidden">
            {shown.map((o) => (
              <li key={o.id} className="rounded-2xl border border-warm-gray bg-white p-3">
                <button onClick={() => setOpenId(o.id)} className="block w-full text-left">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold">#{o.order_number}</span>
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </span>
                  <span className="mt-1 flex justify-between gap-2 text-base">
                    <span className="truncate font-medium">{o.customer_name}</span>
                    <b className="tabular-nums">{rupees(Number(o.total))}</b>
                  </span>
                  <span className="block text-sm text-secondary-text">{dayDate(o.created_at)}, {clock(o.created_at)} · {itemsSummary(o, 1)}</span>
                </button>
                <div className="mt-2 flex items-center gap-2">
                  {statusSelect(o)}
                  <span className="ml-auto">{rowMenu(o)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

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
