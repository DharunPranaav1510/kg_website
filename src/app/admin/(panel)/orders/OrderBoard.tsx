"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, ChevronDown, MapPin, Phone, Search } from "lucide-react";
import { STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { adminApi } from "../../api";
import { usePoll } from "../../usePoll";
import { useOrderActions } from "../../orderActions";
import OrderPanel from "../../OrderPanel";
import { MoreMenu, rupees } from "../../ui";
import {
  NEXT,
  NEXT_LABEL,
  PREV,
  customerHint,
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
import { mapsLink } from "@/lib/address";

const POLL_MS = 10000;
const COLUMNS: OrderStatus[] = ["new", "confirmed", "out_for_delivery", "delivered"];
const COLUMN_TITLE: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const PHONE_TAB: Record<string, string> = { new: "New", confirmed: "Confirmed", out_for_delivery: "Out", delivered: "Delivered" };

const DOT: Record<string, string> = { new: "bg-amber-400", confirmed: "bg-sky-400", out_for_delivery: "bg-violet-400", delivered: "bg-success" };

const AGE_PILL: Record<Urgency, string> = {
  ok: "bg-success/10 text-success",
  warn: "bg-amber-100 text-amber-800",
  late: "bg-red-100 text-red-700",
};
const AGE_WORD: Record<Urgency, string> = { ok: "", warn: " · waiting", late: " · late" };
const URGENCY_BORDER: Record<Urgency, string> = { ok: "border-warm-gray", warn: "border-amber-400", late: "border-red-400" };

const isToday = (iso: string, now: number) => new Date(iso).toDateString() === new Date(now).toDateString();
const SEEN_KEY = "kg-admin-alerts-card-seen";

function Switch({ on, onChange, label, hint }: { on: boolean; onChange: () => void; label: string; hint?: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={onChange} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-cream">
      <span className="flex-1">
        <span className="block text-base font-medium">{label}</span>
        {hint && <span className="block text-sm text-secondary-text">{hint}</span>}
      </span>
      <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-gray-300"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
      <span className="sr-only">{on ? "On" : "Off"}</span>
    </button>
  );
}

export default function OrderBoard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [history, setHistory] = useState<Record<string, CustomerHistory>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [failing, setFailing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCol, setActiveCol] = useState<OrderStatus>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [arrived, setArrived] = useState<Record<string, number>>({});

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const [notify, setNotify] = useState(false);
  const [awake, setAwake] = useState(false);
  const [notifyBlocked, setNotifyBlocked] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [stripOpen, setStripOpen] = useState(true);

  const known = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const flags = useRef({ sound: false, notify: false });
  flags.current = { sound, notify };
  const alertsBox = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setStripOpen(window.matchMedia("(min-width: 1024px)").matches);
    try {
      setShowIntro(localStorage.getItem(SEEN_KEY) !== "1");
    } catch {
      setShowIntro(true);
    }
    if ("Notification" in window && Notification.permission === "denied") setNotifyBlocked(true);
  }, []);

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
      setFailing(false);
      setError("");

      const fresh = list.filter((o) => known.current && !known.current.has(o.id) && o.status === "new");
      if (fresh.length > 0) {
        const stamp = Date.now();
        setArrived((a) => ({ ...a, ...Object.fromEntries(fresh.map((o) => [o.id, stamp])) }));
        if (flags.current.sound) beep();
        if (flags.current.notify && "Notification" in window && Notification.permission === "granted") {
          const o = fresh[0];
          new Notification(`New order #${o.order_number} · ₹${o.total}`, { body: `${o.customer_name} — ${itemsSummary(o)}` });
        }
        setActiveCol("new");
      }
      known.current = new Set(list.map((o) => o.id));
    } catch (e) {
      setFailing(true);
      setError((e as Error).message);
      setOrders((prev) => prev ?? []);
    }
  }, [beep]);

  useEffect(() => {
    load();
  }, [load]);
  usePoll(load, POLL_MS);

  // Live clocks tick locally; no server calls.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const { changeStatus, block, unblock } = useOrderActions(setOrders, load);

  const newCount = (orders ?? []).filter((o) => o.status === "new").length;
  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) New orders — KG Foods` : "Live orders — KG Foods";
  }, [newCount]);

  useEffect(() => {
    if (!alertsOpen) return;
    const away = (e: MouseEvent) => !alertsBox.current?.contains(e.target as Node) && setAlertsOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [alertsOpen]);

  async function toggleSound() {
    if (!sound) {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      beep();
    }
    setSound(!sound);
  }
  async function testSound() {
    audio.current ??= new AudioContext();
    await audio.current.resume();
    beep();
  }
  async function toggleNotify() {
    if (!notify && "Notification" in window && Notification.permission !== "granted") {
      if ((await Notification.requestPermission()) !== "granted") {
        setNotifyBlocked(true);
        return;
      }
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
  function dismissIntro() {
    setShowIntro(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
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
        .filter((o) => (s === "delivered" ? isToday(o.created_at, now) : true))
        // Longest waiting at the top for open work; newest first for done.
        .sort((a, b) => (s === "delivered" ? +new Date(b.created_at) - +new Date(a.created_at) : +new Date(a.created_at) - +new Date(b.created_at)));
    return Object.fromEntries(COLUMNS.map((s) => [s, by(s)])) as Record<OrderStatus, Order[]>;
  }, [list, matches, now]);

  const todayOrders = list.filter((o) => o.status !== "cancelled" && isToday(o.created_at, now));
  const latest = list.reduce<Order | null>((m, o) => (!m || +new Date(o.created_at) > +new Date(m.created_at) ? o : m), null);

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

  const openOrder = openId ? list.find((o) => o.id === openId) ?? null : null;

  // Swipe left or right on a phone to change column.
  function onTouchStart(e: React.TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = COLUMNS.indexOf(activeCol);
    const n = COLUMNS[Math.min(COLUMNS.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1)))];
    setActiveCol(n);
  }

  const syncAge = lastSync ? Math.max(0, Math.floor((now - lastSync) / 1000)) : null;

  return (
    <div className="mx-auto max-w-[1500px]">
      {/* Top strip */}
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-2xl sm:text-3xl">Live orders</h1>

        <label className="relative min-w-[12rem] flex-1 sm:max-w-sm">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone or order number"
            aria-label="Search orders"
            className="min-h-12 w-full rounded-full border border-warm-gray bg-white pl-11 pr-4 text-base outline-none focus:border-accent"
          />
        </label>

        <span className={`text-sm ${failing ? "font-semibold text-red-600" : "text-secondary-text"}`} aria-live="polite">
          {failing ? "Retrying…" : syncAge === null ? "Connecting…" : `Updated ${syncAge < 5 ? "just now" : `${syncAge} s ago`}`}
        </span>

        <div ref={alertsBox} className="relative">
          <button onClick={() => setAlertsOpen((o) => !o)} aria-expanded={alertsOpen} className="flex min-h-12 items-center gap-2 rounded-full border border-warm-gray bg-white px-5 text-base font-medium hover:bg-cream">
            <BellRing size={18} /> Alerts {(sound || notify || awake) && <span className="h-2.5 w-2.5 rounded-full bg-success" aria-label="some alerts are on" />}
          </button>
          {alertsOpen && (
            <div role="dialog" aria-label="Alerts" className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-warm-gray bg-white p-3 shadow-hover">
              <Switch on={sound} onChange={toggleSound} label="Sound" hint="A beep for every new order" />
              <Switch on={notify} onChange={toggleNotify} label="Browser notification" hint="A pop-up even in another tab" />
              <Switch on={awake} onChange={toggleAwake} label="Keep screen awake" hint="The screen will not go to sleep" />
              {notifyBlocked && <p className="mx-2 mt-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Notifications are blocked. Click the lock icon next to the web address and choose Allow for notifications.</p>}
              <button onClick={testSound} className="mt-2 min-h-12 w-full rounded-full border border-warm-gray text-base font-medium hover:bg-cream">Test sound</button>
            </div>
          )}
        </div>
      </header>

      {showIntro && (
        <section className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <p className="min-w-[14rem] flex-1 text-base font-medium">Turn on alerts so you never miss an order.</p>
          <button onClick={() => { setAlertsOpen(true); dismissIntro(); }} className="btn-primary min-h-12 !text-base">Set up alerts</button>
          <button onClick={dismissIntro} className="min-h-12 px-3 text-base text-secondary-text hover:underline">Not now</button>
        </section>
      )}

      {error && !failing && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {/* Today so far */}
      <section className="mb-4 rounded-2xl border border-warm-gray bg-white">
        <button onClick={() => setStripOpen((o) => !o)} aria-expanded={stripOpen} className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-base font-medium">
          Today so far
          <span className="text-sm font-normal text-secondary-text">
            {todayOrders.length} order{todayOrders.length === 1 ? "" : "s"} · {rupees(todayOrders.reduce((s, o) => s + Number(o.total), 0))}
          </span>
          <ChevronDown size={18} className={`ml-auto transition-transform ${stripOpen ? "rotate-180" : ""}`} />
        </button>
        {stripOpen && (
          <div className="grid gap-4 border-t border-warm-gray p-4 lg:grid-cols-3">
            <div>
              <p className="text-sm text-secondary-text">Time since last order</p>
              <p className="font-display text-3xl">{latest ? formatAge(now - new Date(latest.created_at).getTime()) : "—"}</p>
              <p className="truncate text-sm text-secondary-text">{latest ? `#${latest.order_number} · ${latest.customer_name}` : "No orders yet"}</p>
            </div>
            <div>
              <p className="mb-2 text-sm text-secondary-text">Top sellers today</p>
              {topItems.length === 0 ? (
                <p className="text-base text-secondary-text">Nothing sold yet.</p>
              ) : (
                <ul className="space-y-1 text-base">
                  {topItems.slice(0, 4).map(([name, v]) => (
                    <li key={name} className="flex justify-between gap-2">
                      <span className="truncate">{name}</span>
                      <span className="tabular-nums text-secondary-text">{v.count}× · {rupees(v.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm text-secondary-text">Orders by hour</p>
              <div className="flex h-14 items-end gap-[3px]" role="img" aria-label="Orders per hour today">
                {hourly.map((h) => (
                  <div
                    key={h.hour}
                    title={`${h.hour}:00 — ${h.count} order${h.count === 1 ? "" : "s"}`}
                    className={`flex-1 rounded-sm ${h.hour === new Date(now).getHours() ? "bg-accent" : "bg-accent/35"}`}
                    style={{ height: `${Math.max(6, (h.count / maxHour) * 100)}%`, opacity: h.count ? 1 : 0.25 }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-secondary-text"><span>6 AM</span><span>1 PM</span><span>8 PM</span></div>
            </div>
          </div>
        )}
      </section>

      {/* Phone column tabs */}
      <div className="mb-3 grid grid-cols-4 gap-1 lg:hidden" role="tablist">
        {COLUMNS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={activeCol === s}
            onClick={() => setActiveCol(s)}
            className={`min-h-12 rounded-xl border px-1 text-sm font-medium ${activeCol === s ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white"}`}
          >
            {PHONE_TAB[s]}{" "}
            <span className={s === "new" && columns.new.length > 0 && activeCol !== s ? "rounded-full bg-red-600 px-1.5 text-white" : ""}>{columns[s].length}</span>
          </button>
        ))}
      </div>

      {orders === null ? (
        <p className="text-base text-secondary-text">Loading orders…</p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {COLUMNS.map((s) => (
            <section key={s} className={`${activeCol === s ? "block" : "hidden"} rounded-2xl bg-warm-gray/40 p-2.5 lg:block`} aria-label={COLUMN_TITLE[s]}>
              <div className="flex items-center gap-2 px-1.5 py-2">
                <span className={`h-3 w-3 rounded-full ${DOT[s]}`} aria-hidden="true" />
                <h2 className="font-body text-base font-semibold">{COLUMN_TITLE[s]}{s === "delivered" && " today"}</h2>
                <span className={`ml-auto rounded-full px-2.5 text-sm font-semibold ${s === "new" && columns[s].length > 0 ? "bg-red-600 text-white" : "bg-white text-secondary-text"}`}>{columns[s].length}</span>
              </div>

              <div className="space-y-2.5 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto">
                {columns[s].length === 0 && (
                  <p className="rounded-xl border border-dashed border-warm-gray px-3 py-8 text-center text-base text-secondary-text">
                    {s === "new" ? "No new orders. You're all caught up." : "Nothing here"}
                  </p>
                )}

                {columns[s].map((o) => {
                  if (s === "delivered") {
                    return (
                      <button key={o.id} onClick={() => setOpenId(o.id)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-warm-gray bg-white px-3 text-left text-base">
                        <span className="font-display">#{o.order_number}</span>
                        <span className="min-w-0 flex-1 truncate">{o.customer_name}</span>
                        <span className="tabular-nums font-semibold">{rupees(Number(o.total))}</span>
                      </button>
                    );
                  }
                  const urgency = urgencyOf(o, now);
                  const age = now - new Date(o.created_at).getTime();
                  const just = arrived[o.id] && now - arrived[o.id] < 10000;
                  const hint = customerHint(history[o.phone]);
                  const isBlocked = blocked.includes(o.phone);
                  const next = NEXT[o.status];
                  const prev = PREV[o.status];
                  return (
                    <article key={o.id} className={`rounded-xl border-2 bg-white p-3 shadow-sm ${URGENCY_BORDER[urgency]} ${just ? "ring-4 ring-accent/40" : ""}`}>
                      <div role="button" tabIndex={0} onClick={() => setOpenId(o.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenId(o.id)} className="cursor-pointer space-y-1.5" aria-label={`Open order ${o.order_number}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xl font-bold">#{o.order_number}</span>
                          <span className={`ml-auto whitespace-nowrap rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums ${AGE_PILL[urgency]}`}>{formatAge(age)}{AGE_WORD[urgency]}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base font-semibold">{o.customer_name}</span>
                          {isBlocked ? (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-sm font-bold text-white">Blocked number</span>
                          ) : (
                            <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${hint.text === "First order" ? "bg-accent/15 text-accent" : hint.tone === "bad" ? "bg-red-100 text-red-700" : "bg-warm-gray text-secondary-text"}`}>{hint.text}</span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-base text-secondary-text">{itemsSummary(o, 3)}</p>
                        <p className="flex items-baseline justify-between gap-2 text-base">
                          <span className={o.slot?.startsWith("Deliver now") ? "font-bold" : "text-secondary-text"}>{o.slot ? (o.slot.startsWith("Deliver now") ? "Deliver now" : o.slot.split(" (")[0]) : ""}</span>
                          <b className="tabular-nums text-lg">{rupees(Number(o.total))}</b>
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-secondary-text">
                          <a href={mapsLink({ lat: o.lat, lng: o.lng, address: o.address })} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open in maps" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cream text-accent"><MapPin size={16} /></a>
                          <span className="truncate">{o.address}</span>
                        </p>
                        {o.note && <p className="rounded-lg bg-yellow-50 px-2.5 py-1.5 text-sm text-yellow-900">“{o.note}”</p>}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a href={`tel:${o.phone}`} className="order-1 flex min-h-12 flex-shrink-0 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream"><Phone size={16} /> Call</a>
                        {next && (
                          <button onClick={() => changeStatus(o, next)} className="btn-primary order-3 min-h-12 basis-full whitespace-nowrap !px-3 !text-base">
                            {NEXT_LABEL[o.status]}
                          </button>
                        )}
                        <span className="order-2 ml-auto"><MoreMenu
                          items={[
                            { label: "WhatsApp message", href: whatsappLink(o) },
                            { label: "Print slip", onSelect: () => printSlip(o) },
                            { label: "Print bill", href: `/admin/bill/${o.id}` },
                            { label: `Step back to ${prev ? STATUS_LABEL[prev] : ""}`, onSelect: () => prev && changeStatus(o, prev, false), hidden: !prev },
                            { label: "Cancel order", onSelect: () => changeStatus(o, "cancelled"), danger: true },
                            { label: isBlocked ? "Unblock this phone number" : "Block this phone number", onSelect: () => (isBlocked ? unblock(o.phone) : block(o.phone)), danger: true },
                          ]}
                        /></span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <OrderPanel
        order={openOrder}
        history={history}
        blocked={blocked}
        now={now}
        onClose={() => setOpenId(null)}
        onStatus={(o, st) => changeStatus(o, st, st !== PREV[o.status])}
        onBlock={block}
        onUnblock={unblock}
      />
    </div>
  );
}
