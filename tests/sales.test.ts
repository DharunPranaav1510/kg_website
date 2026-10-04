import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSalesReport, istDayStart, pctChange, resolveRange, type SalesOrder } from "../src/lib/sales";

// 2026-10-07 15:00 IST (Wednesday)
const NOW = Date.UTC(2026, 9, 7, 9, 30);
const ist = (y: number, m: number, d: number, h: number, min = 0) => new Date(Date.UTC(y, m - 1, d, h, min) - 5.5 * 3600 * 1000).toISOString();
const order = (created_at: string, total: number, extra: Partial<SalesOrder> = {}): SalesOrder => ({
  created_at,
  total,
  status: "delivered",
  phone: "+919677833339",
  slot: "Morning (7 – 10 AM)",
  items: [{ name: "Chicken Breast", category: "Chicken", price: total - 30 }],
  ...extra,
});
const cat = (i: { category?: string }) => i.category ?? "Other";

test("IST day boundaries", () => {
  assert.equal(new Date(istDayStart(NOW)).toISOString(), "2026-10-06T18:30:00.000Z"); // Oct 7 00:00 IST
  // 00:10 IST belongs to the new day, 23:50 IST to the old one
  assert.equal(istDayStart(Date.UTC(2026, 9, 6, 18, 40)), Date.UTC(2026, 9, 6, 18, 30));
  assert.equal(istDayStart(Date.UTC(2026, 9, 6, 18, 20)), Date.UTC(2026, 9, 5, 18, 30));
});

test("ranges and comparison windows", () => {
  const w = resolveRange("7d", NOW);
  assert.equal(w.days, 7);
  assert.equal(w.to - w.from > 6 * 86400000, true);
  assert.equal(w.from - w.prevFrom, 7 * 86400000);
  assert.equal(w.to - w.prevTo, 7 * 86400000);
  const t = resolveRange("today", NOW);
  assert.equal(t.to - t.prevTo, 86400000);
  const m = resolveRange("month", NOW);
  assert.equal(new Date(m.from).toISOString(), "2026-09-30T18:30:00.000Z"); // Oct 1 00:00 IST
  assert.equal(m.days, 7);
  assert.ok(m.prevTo < m.from);
});

test("report totals, comparison, buckets", () => {
  const w = resolveRange("7d", NOW);
  const current = [
    order(ist(2026, 10, 7, 9), 530),
    order(ist(2026, 10, 7, 11), 280, { phone: "+919000000001", items: [{ name: "Eggs", category: "Eggs", price: 250 }] }),
    order(ist(2026, 10, 3, 18), 400, { status: "cancelled" }),
    order(ist(2026, 10, 1, 10), 230),
  ];
  const previous = [order(ist(2026, 9, 28, 10), 330), order(ist(2026, 9, 27, 10), 300, { status: "cancelled" })];
  const r = buildSalesReport(w, current, previous, new Set(["+919677833339"]), cat);

  assert.equal(r.current.orders, 3);
  assert.equal(r.current.revenue, 530 + 280 + 230);
  assert.equal(r.current.cancelled, 1);
  assert.equal(r.current.cancelRate, 0.25);
  assert.equal(r.current.customers, 2);
  assert.equal(r.current.newCustomers, 1); // +919000000001
  assert.equal(r.current.returningCustomers, 1);
  assert.equal(r.previous.revenue, 330);
  assert.equal(r.series.length, 7);
  assert.equal(r.series.reduce((s, b) => s + b.revenue, 0), r.current.revenue);
  assert.equal(r.series.reduce((s, b) => s + b.prevRevenue, 0), 330);
  assert.equal(r.series[6].orders, 2); // Oct 7 is the last day
  assert.equal(r.series[0].orders, 1); // Oct 1 is the first day
  assert.equal(r.products[0].name, "Chicken Breast");
  assert.equal(r.categories.find((c) => c.name === "Eggs")?.revenue, 250);
  assert.equal(r.byHour[9].orders, 1);
  assert.equal(r.byWeekday[3].orders, 2); // Wednesday
  assert.equal(r.slots[0].orders, 3);
});

test("today uses hourly buckets up to the current hour", () => {
  const w = resolveRange("today", NOW);
  const r = buildSalesReport(w, [order(ist(2026, 10, 7, 9), 530)], [order(ist(2026, 10, 6, 9, 30), 100)], new Set(), cat);
  assert.equal(r.granularity, "hour");
  assert.equal(r.series.length, 16); // 12 AM .. 3 PM
  assert.equal(r.series[9].orders, 1);
  assert.equal(r.series[9].prevOrders, 1);
});

test("pctChange", () => {
  assert.equal(pctChange(150, 100), 50);
  assert.equal(pctChange(50, 100), -50);
  assert.equal(pctChange(0, 0), 0);
  assert.equal(pctChange(10, 0), null);
});
