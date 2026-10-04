// Sales aggregation for the admin "Sales" page. Pure functions (no database
// access) so they can be unit-tested. All days are Indian Standard Time.

const IST_OFFSET = 5.5 * 3600 * 1000;
const DAY = 86400000;

export const RANGE_IDS = ["today", "7d", "30d", "90d", "month"] as const;
export type RangeId = (typeof RANGE_IDS)[number];

export const RANGE_LABEL: Record<RangeId, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  month: "This month",
};

export interface SalesItem {
  id?: string;
  name: string;
  category?: string;
  weightKg?: number;
  price: number;
}

export interface SalesOrder {
  created_at: string;
  total: number | string;
  delivery_fee?: number | string;
  status: string;
  phone: string;
  slot?: string | null;
  items: SalesItem[];
}

export interface RangeWindow {
  id: RangeId;
  from: number; // inclusive, ms
  to: number; // inclusive, ms (now)
  prevFrom: number;
  prevTo: number;
  days: number; // calendar days covered by the current window
  label: string;
  prevLabel: string;
}

/** Midnight (IST) at or before the instant, as a UTC ms timestamp. */
export const istDayStart = (ms: number) => Math.floor((ms + IST_OFFSET) / DAY) * DAY - IST_OFFSET;

function istMonthStart(ms: number, monthsBack = 0) {
  const d = new Date(ms + IST_OFFSET);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsBack, 1) - IST_OFFSET;
}

export function resolveRange(id: RangeId, now: number): RangeWindow {
  const todayStart = istDayStart(now);
  if (id === "month") {
    const from = istMonthStart(now);
    const prevFrom = istMonthStart(now, 1);
    const prevMonthEnd = from - 1;
    const prevTo = Math.min(prevFrom + (now - from), prevMonthEnd);
    return {
      id,
      from,
      to: now,
      prevFrom,
      prevTo,
      days: Math.floor((todayStart - from) / DAY) + 1,
      label: "This month so far",
      prevLabel: "Same days last month",
    };
  }
  const days = id === "today" ? 1 : id === "7d" ? 7 : id === "30d" ? 30 : 90;
  const from = todayStart - (days - 1) * DAY;
  return {
    id,
    from,
    to: now,
    prevFrom: from - days * DAY,
    prevTo: now - days * DAY,
    days,
    label: RANGE_LABEL[id],
    prevLabel: id === "today" ? "Yesterday (same time)" : `Previous ${days} days`,
  };
}

export interface Totals {
  revenue: number;
  orders: number;
  aov: number;
  delivered: number;
  cancelled: number;
  cancelRate: number; // 0..1 of all orders placed
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  itemsPerOrder: number;
}

export interface Bucket {
  label: string; // "Mon 5 Oct" or "2 PM"
  revenue: number;
  orders: number;
  prevRevenue: number;
  prevOrders: number;
}

export interface Ranked {
  name: string;
  revenue: number;
  orders: number;
  prevRevenue: number;
}

export interface SalesReport {
  range: Pick<RangeWindow, "id" | "label" | "prevLabel" | "days" | "from" | "to">;
  current: Totals;
  previous: Totals;
  granularity: "hour" | "day";
  series: Bucket[];
  byHour: { hour: number; orders: number }[];
  byWeekday: { day: string; orders: number; revenue: number }[];
  categories: Ranked[];
  products: Ranked[];
  slots: { slot: string; orders: number }[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const istParts = (ms: number) => {
  const d = new Date(ms + IST_OFFSET);
  return { hour: d.getUTCHours(), weekday: d.getUTCDay(), date: d };
};
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function totals(orders: SalesOrder[], knownBefore: Set<string>): Totals {
  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + num(o.total), 0);
  const cancelled = orders.length - live.length;
  const phones = new Set(live.map((o) => o.phone));
  let newCustomers = 0;
  for (const p of phones) if (!knownBefore.has(p)) newCustomers++;
  return {
    revenue,
    orders: live.length,
    aov: live.length ? revenue / live.length : 0,
    delivered: live.filter((o) => o.status === "delivered").length,
    cancelled,
    cancelRate: orders.length ? cancelled / orders.length : 0,
    customers: phones.size,
    newCustomers,
    returningCustomers: phones.size - newCustomers,
    itemsPerOrder: live.length ? live.reduce((s, o) => s + o.items.length, 0) / live.length : 0,
  };
}

function rank(
  orders: SalesOrder[],
  keyOf: (item: SalesItem) => string
): Map<string, { revenue: number; orders: number }> {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const seenInOrder = new Set<string>();
    for (const item of o.items) {
      const key = keyOf(item);
      const cur = map.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += num(item.price);
      if (!seenInOrder.has(key)) cur.orders++;
      seenInOrder.add(key);
      map.set(key, cur);
    }
  }
  return map;
}

function rankedList(
  cur: Map<string, { revenue: number; orders: number }>,
  prev: Map<string, { revenue: number; orders: number }>,
  limit: number
): Ranked[] {
  return [...cur.entries()]
    .map(([name, v]) => ({ name, revenue: v.revenue, orders: v.orders, prevRevenue: prev.get(name)?.revenue ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * @param current  orders inside the range
 * @param previous orders inside the comparison window
 * @param knownBefore phones that had an order before the range began
 */
export function buildSalesReport(
  window: RangeWindow,
  current: SalesOrder[],
  previous: SalesOrder[],
  knownBefore: Set<string>,
  categoryOf: (item: SalesItem) => string
): SalesReport {
  // Phones that ordered before the *previous* window began are unknown here, so
  // new-vs-returning for the previous window uses orders before `from`: an
  // approximation that is only shown for the current period.
  const cur = totals(current, knownBefore);
  const prev = totals(previous, new Set());

  const granularity = window.id === "today" ? "hour" : "day";
  const liveCur = current.filter((o) => o.status !== "cancelled");
  const livePrev = previous.filter((o) => o.status !== "cancelled");

  let series: Bucket[];
  if (granularity === "hour") {
    const nowHour = istParts(window.to).hour;
    series = Array.from({ length: nowHour + 1 }, (_, h) => ({
      label: `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`,
      revenue: 0,
      orders: 0,
      prevRevenue: 0,
      prevOrders: 0,
    }));
    for (const o of liveCur) {
      const b = series[istParts(new Date(o.created_at).getTime()).hour];
      if (b) {
        b.revenue += num(o.total);
        b.orders++;
      }
    }
    for (const o of livePrev) {
      const b = series[istParts(new Date(o.created_at).getTime()).hour];
      if (b) {
        b.prevRevenue += num(o.total);
        b.prevOrders++;
      }
    }
  } else {
    series = Array.from({ length: window.days }, (_, i) => {
      const start = window.from + i * DAY;
      const p = istParts(start);
      return {
        label: `${WEEKDAYS[p.weekday]} ${p.date.getUTCDate()} ${p.date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}`,
        revenue: 0,
        orders: 0,
        prevRevenue: 0,
        prevOrders: 0,
      };
    });
    const idx = (t: number, base: number) => Math.floor((istDayStart(t) - istDayStart(base)) / DAY);
    for (const o of liveCur) {
      const b = series[idx(new Date(o.created_at).getTime(), window.from)];
      if (b) {
        b.revenue += num(o.total);
        b.orders++;
      }
    }
    for (const o of livePrev) {
      const b = series[idx(new Date(o.created_at).getTime(), window.prevFrom)];
      if (b) {
        b.prevRevenue += num(o.total);
        b.prevOrders++;
      }
    }
  }

  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));
  const byWeekday = WEEKDAYS.map((day) => ({ day, orders: 0, revenue: 0 }));
  for (const o of liveCur) {
    const p = istParts(new Date(o.created_at).getTime());
    byHour[p.hour].orders++;
    byWeekday[p.weekday].orders++;
    byWeekday[p.weekday].revenue += num(o.total);
  }

  const slotMap = new Map<string, number>();
  for (const o of liveCur) slotMap.set(o.slot || "Not chosen", (slotMap.get(o.slot || "Not chosen") ?? 0) + 1);

  return {
    range: { id: window.id, label: window.label, prevLabel: window.prevLabel, days: window.days, from: window.from, to: window.to },
    current: cur,
    previous: prev,
    granularity,
    series,
    byHour,
    byWeekday,
    categories: rankedList(rank(current, categoryOf), rank(previous, categoryOf), 8),
    products: rankedList(rank(current, (i) => i.name), rank(previous, (i) => i.name), 10),
    slots: [...slotMap.entries()].map(([slot, orders]) => ({ slot, orders })).sort((a, b) => b.orders - a.orders),
  };
}

/** Percent change, or null when there is nothing to compare against. */
export function pctChange(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return ((now - before) / before) * 100;
}
