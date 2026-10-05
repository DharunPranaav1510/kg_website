"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { adminApi } from "../../api";
import { usePoll } from "../../usePoll";
import {
  NEXT,
  NEXT_LABEL,
  PREV,
  formatAge,
  itemsSummary,
  printSlip,
  urgencyOf,
  whatsappLink,
  type CustomerHistory,
  type Order,
  type OrdersResponse,
  type Urgency,
} from "../../orderUtils";
import { AddressBlock, BlockButton, ContactLines, CustomerBadge } from "../../OrderParts";

const POLL_MS = 10000;
const COLUMNS: OrderStatus[] = ["new", "confirmed", "out_for_delivery", "delivered"];

const COLUMN_STYLE: Record<string, { bar: string; chip: string }> = {
  new: { bar: "bg-amber-400", chip: "bg-amber-100 text-amber-800" },
  confirmed: { bar: "bg-sky-400", chip: "bg-sky-100 text-sky-800" },
  out_for_delivery: { bar: "bg-violet-400", chip: "bg-violet-100 text-violet-800" },
  delivered: { bar: "bg-success", chip: "bg-success/10 text-success" },
};
const URGENCY_STYLE: Record<Urgency, string> = {
  ok: "border-warm-gray",
  warn: "border-amber-400 bg-amber-50/40",
  late: "border-red-400 bg-red-50/50",
};

const isToday = (iso: string, now: number) =>
  new Date(iso).toDateString() === new Date(now).toDateString();

export default function OrderBoard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [history, setHistory] = useState<Record<string, CustomerHistory>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCol, setActiveCol] = useState<OrderStatus>("new");
  const [open, setOpen] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [notify, setNotify] = useState(false);
  const [awake, setAwake] = useState(false);
  const [toast, setToast] = useState<{ id: string; from: OrderStatus; text: string } | null>(null);

  const known = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flags = useRef({ sound: false, notify: false });
  flags.current = { sound, notify };

  const beep = useCallback(() => {
    const ctx = audio.current;
    if (!ctx) return;
    [880, 1175, 880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.22;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const { orders: list, history: hist, blocked: blk } = (await adminApi("/api/admin/orders")) as OrdersResponse;
      setOrders(list);
      setHistory(hist);
      setBlocked(blk);
      setLastSync(Date.now());
      setError("");

      const fresh = list.filter((o) => known.current && !known.current.has(o.id) && o.status === "new");
      if (fresh.length > 0) {
        if (flags.current.sound) beep();
        if (flags.current.notify && "Notification" in window && Notification.permission === "granted") {
          const o = fresh[0];
          new Notification(`New order #${o.order_number} · ₹${o.total}`, {
            body: `${o.customer_name} — ${itemsSummary(o)}`,
          });
        }
        setActiveCol("new");
      }
      known.current = new Set(list.map((o) => o.id));
    } catch (e) {
      setError((e as Error).message);
      setOrders((prev) => prev ?? []);
    }
  }, [beep]);

  useEffect(() => {
    load();
  }, [load]);
  usePoll(load, POLL_MS);

  // Live clocks ("12 min ago") tick locally; no server calls.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(tick);
  }, []);

  // Browser-tab title shows how many orders need action.
  const newCount = (orders ?? []).filter((o) => o.status === "new").length;
  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) New orders — KG Foods` : "Live orders — KG Foods";
  }, [newCount]);

  async function changeStatus(o: Order, status: OrderStatus, withUndo = true) {
    if (status === "cancelled" && !window.confirm(`Cancel order #${o.order_number}?`)) return;
    const from = o.status;
    setOrders((prev) => prev && prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    try {
      await adminApi(`/api/admin/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (withUndo) {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ id: o.id, from, text: `#${o.order_number} → ${STATUS_LABEL[status]}` });
        toastTimer.current = setTimeout(() => setToast(null), 7000);
      }
    } catch (e) {
      setError((e as Error).message);
      await load();
    }
  }

  async function toggleSound() {
    if (!sound) {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      beep();
    }
    setSound(!sound);
  }

  async function toggleNotify() {
    if (!notify && "Notification" in window && Notification.permission !== "granted") {
      if ((await Notification.requestPermission()) !== "granted") return;
    }
    setNotify(!notify);
  }

  async function toggleAwake() {
    if (awake) {
      await wakeLock.current?.release();
      wakeLock.current = null;
      setAwake(false);
      return;
    }
    try {
      wakeLock.current = await navigator.wakeLock.request("screen");
      setAwake(true);
    } catch {
      setError("This browser can't keep the screen on.");
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  const list = orders ?? [];
  const q = query.trim().toLowerCase();
  const matches = useCallback(
    (o: Order) =>
      !q ||
      String(o.order_number) === q.replace("#", "") ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    [q]
  );

  const columns = useMemo(() => {
    const by = (s: OrderStatus) =>
      list
        .filter((o) => o.status === s && matches(o))
        // Oldest first for open work (they have waited longest); newest first for done.
        .filter((o) => (s === "delivered" ? isToday(o.created_at, now) : true))
        .sort((a, b) =>
          s === "delivered"
            ? +new Date(b.created_at) - +new Date(a.created_at)
            : +new Date(a.created_at) - +new Date(b.created_at)
        );
    return Object.fromEntries(COLUMNS.map((s) => [s, by(s)])) as Record<OrderStatus, Order[]>;
  }, [list, matches, now]);

  const todayOrders = list.filter((o) => o.status !== "cancelled" && isToday(o.created_at, now));
  const sales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const latest = list.reduce<Order | null>(
    (m, o) => (!m || +new Date(o.created_at) > +new Date(m.created_at) ? o : m),
    null
  );
  const oldestNew = columns.new[0];
  const cancelledToday = list.filter((o) => o.status === "cancelled" && isToday(o.created_at, now)).length;

  const hourly = useMemo(() => {
    const hours = Array.from({ length: 15 }, (_, i) => ({ hour: i + 6, count: 0 }));
    todayOrders.forEach((o) => {
      const h = new Date(o.created_at).getHours();
      const slot = hours.find((x) => x.hour === h);
      if (slot) slot.count++;
    });
    return hours;
  }, [todayOrders]);
  const maxHour = Math.max(1, ...hourly.map((h) => h.count));

  const topItems = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    todayOrders.forEach((o) =>
      o.items.forEach((i) => {
        const cur = map.get(i.name) ?? { count: 0, revenue: 0 };
        map.set(i.name, { count: cur.count + 1, revenue: cur.revenue + i.price });
      })
    );
    return [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  }, [todayOrders]);

  const pill = (on: boolean) =>
    `flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      on ? "bg-primary-text text-white border-primary-text" : "bg-white border-warm-gray text-secondary-text hover:text-primary-text"
    }`;

  return (
    <div className="mx-auto max-w-[1500px] pb-24">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <div className="mr-auto">
          <h1 className="font-display text-2xl sm:text-3xl text-primary-text flex items-center gap-3">
            Live orders
            <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-success">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              {lastSync ? `Updated ${formatAge(now - lastSync)}` : "Connecting…"}
            </span>
          </h1>
        </div>
        <button onClick={toggleSound} className={pill(sound)}>{sound ? "🔔 Sound on" : "🔕 Sound off"}</button>
        <button onClick={toggleNotify} className={pill(notify)}>{notify ? "💬 Alerts on" : "💬 Desktop alerts"}</button>
        <button onClick={toggleAwake} className={pill(awake)}>{awake ? "☀ Screen stays on" : "☀ Keep screen on"}</button>
        <button onClick={toggleFullscreen} className={pill(false)}>⛶ Fullscreen</button>
        <button onClick={load} className={pill(false)}>↻ Refresh</button>
      </header>

      {error && <p className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>}

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className={`rounded-2xl border p-4 ${newCount > 0 ? "border-amber-300 bg-amber-50" : "border-warm-gray bg-white"}`}>
          <p className="text-xs text-secondary-text">Time since last order</p>
          <p className="font-display text-3xl leading-tight">
            {latest ? formatAge(now - new Date(latest.created_at).getTime()) : "—"}
          </p>
          <p className="text-xs text-secondary-text truncate">
            {latest ? `#${latest.order_number} · ${latest.customer_name}` : "No orders yet"}
          </p>
        </div>
        <div className={`rounded-2xl border p-4 ${oldestNew && urgencyOf(oldestNew, now) === "late" ? "border-red-300 bg-red-50" : "border-warm-gray bg-white"}`}>
          <p className="text-xs text-secondary-text">Waiting for you</p>
          <p className="font-display text-3xl leading-tight">{newCount}</p>
          <p className="text-xs text-secondary-text">
            {oldestNew ? `Oldest waiting ${formatAge(now - new Date(oldestNew.created_at).getTime())}` : "All caught up 🎉"}
          </p>
        </div>
        <div className="rounded-2xl border border-warm-gray bg-white p-4">
          <p className="text-xs text-secondary-text">Today</p>
          <p className="font-display text-3xl leading-tight">₹{sales}</p>
          <p className="text-xs text-secondary-text">
            {todayOrders.length} order{todayOrders.length === 1 ? "" : "s"}
            {todayOrders.length > 0 && ` · avg ₹${Math.round(sales / todayOrders.length)}`}
            {cancelledToday > 0 && ` · ${cancelledToday} cancelled`}
          </p>
        </div>
        <div className="rounded-2xl border border-warm-gray bg-white p-4">
          <p className="text-xs text-secondary-text mb-1">Orders by hour</p>
          <div className="flex items-end gap-[3px] h-12" role="img" aria-label="Orders per hour today">
            {hourly.map((h) => (
              <div
                key={h.hour}
                title={`${h.hour}:00 — ${h.count} order${h.count === 1 ? "" : "s"}`}
                className={`flex-1 rounded-sm ${h.hour === new Date(now).getHours() ? "bg-accent" : "bg-accent/35"}`}
                style={{ height: `${Math.max(6, (h.count / maxHour) * 100)}%`, opacity: h.count ? 1 : 0.25 }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-secondary-text mt-1"><span>6am</span><span>1pm</span><span>8pm</span></div>
        </div>
      </section>

      {/* Search + mobile column tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone or #order…"
          className="flex-1 min-w-[12rem] rounded-full border border-warm-gray bg-white px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex gap-1.5 overflow-x-auto lg:hidden">
          {COLUMNS.map((s) => (
            <button key={s} onClick={() => setActiveCol(s)} className={pill(activeCol === s)}>
              {STATUS_LABEL[s]} · {columns[s].length}
            </button>
          ))}
        </div>
      </div>

      {orders === null ? (
        <p className="text-secondary-text">Loading orders…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((s) => (
            <section key={s} className={`${activeCol === s ? "block" : "hidden"} lg:block rounded-2xl bg-warm-gray/40 p-2.5`}>
              <div className="flex items-center gap-2 px-1.5 py-2">
                <span className={`h-2.5 w-2.5 rounded-full ${COLUMN_STYLE[s].bar}`} />
                <h2 className="font-medium text-sm">{STATUS_LABEL[s]}{s === "delivered" && " today"}</h2>
                <span className={`ml-auto rounded-full px-2 text-xs font-semibold ${COLUMN_STYLE[s].chip}`}>{columns[s].length}</span>
              </div>

              <div className="space-y-2.5">
                {columns[s].length === 0 && (
                  <p className="rounded-xl border border-dashed border-warm-gray px-3 py-8 text-center text-xs text-secondary-text">
                    {s === "new" ? "No new orders" : "Nothing here"}
                  </p>
                )}
                {columns[s].map((o) => {
                  const urgency = urgencyOf(o, now);
                  const age = now - new Date(o.created_at).getTime();
                  const fresh = o.status === "new" && age < 120000;
                  const expanded = open === o.id;
                  return (
                    <article
                      key={o.id}
                      className={`rounded-xl border bg-white p-3 shadow-sm ${URGENCY_STYLE[urgency]} ${fresh ? "ring-2 ring-accent/40" : ""}`}
                    >
                      <button onClick={() => setOpen(expanded ? null : o.id)} className="w-full text-left" aria-expanded={expanded}>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg">#{o.order_number}</span>
                          {fresh && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                          <span
                            className={`ml-auto text-xs font-semibold ${
                              urgency === "late" ? "text-red-600" : urgency === "warn" ? "text-amber-600" : "text-secondary-text"
                            }`}
                          >
                            {urgency === "late" && "⚠ "}
                            {formatAge(age)}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{o.customer_name}</p>
                        {(o.status === "new" || blocked.includes(o.phone)) && (
                          <div className="mt-1"><CustomerBadge history={history[o.phone]} blocked={blocked.includes(o.phone)} /></div>
                        )}
                        <p className="text-xs text-secondary-text truncate">{itemsSummary(o)}</p>
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="text-secondary-text">{o.slot ? `🕒 ${o.slot.split(" (")[0]}` : ""}</span>
                          <b className="text-sm">₹{o.total}</b>
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-3 border-t border-warm-gray pt-3 text-sm space-y-2">
                          <ContactLines o={o} />
                          <AddressBlock o={o} />
                          <CustomerBadge history={history[o.phone]} blocked={blocked.includes(o.phone)} />
                          {o.note && <p className="italic">“{o.note}”</p>}
                          <p className="text-xs text-secondary-text">
                            Placed {new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                            {o.slot && ` · ${o.slot}`}
                          </p>
                          <ul className="divide-y divide-warm-gray/70 border-y border-warm-gray/70">
                            {o.items.map((it, i) => (
                              <li key={i} className="flex justify-between py-1">
                                <span>{it.name} <span className="text-secondary-text">· {it.quantity}</span></span>
                                <span>₹{it.price}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="flex justify-between text-xs text-secondary-text">
                            <span>Delivery {Number(o.delivery_fee) ? `₹${o.delivery_fee}` : "free"} · cash on delivery</span>
                            <b className="text-sm text-primary-text">₹{o.total}</b>
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <a href={whatsappLink(o)} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 !px-3 !text-xs">WhatsApp</a>
                            <button onClick={() => printSlip(o)} className="btn-secondary !py-1.5 !px-3 !text-xs">Print</button>
                            {PREV[o.status] && o.status !== "cancelled" && (
                              <button onClick={() => changeStatus(o, PREV[o.status]!, false)} className="text-xs text-secondary-text hover:underline">
                                ← Move back
                              </button>
                            )}
                            <span className="ml-auto flex gap-3">
                              <BlockButton phone={o.phone} blocked={blocked.includes(o.phone)} onChanged={load} />
                              {o.status !== "delivered" && o.status !== "cancelled" && (
                                <button onClick={() => changeStatus(o, "cancelled")} className="text-xs text-red-600 hover:underline">Cancel order</button>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {NEXT[o.status] && (
                        <button
                          onClick={() => changeStatus(o, NEXT[o.status]!)}
                          className="btn-primary mt-3 w-full !py-2.5 !text-sm"
                        >
                          {NEXT_LABEL[o.status]} →
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Top sellers */}
      {topItems.length > 0 && (
        <section className="mt-6 rounded-2xl border border-warm-gray bg-white p-4">
          <h2 className="font-medium text-sm mb-3">Top sellers today</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topItems.map(([name, v]) => (
              <li key={name} className="rounded-xl bg-cream px-3 py-2">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-secondary-text">{v.count} order{v.count === 1 ? "" : "s"} · ₹{v.revenue}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Undo toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-primary-text px-5 py-3 text-sm text-white shadow-hover">
            <span>{toast.text}</span>
            <button
              onClick={() => {
                const o = list.find((x) => x.id === toast.id);
                setToast(null);
                if (o) changeStatus(o, toast.from, false);
              }}
              className="font-semibold text-amber-300 hover:underline"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
