"use client";

import { useCallback, useEffect, useState } from "react";
import { RANGE_IDS, RANGE_LABEL, type RangeId, type SalesReport } from "@/lib/sales";
import { adminApi } from "../../api";
import { Delta, HBars, MiniBars, RankedBars, TrendChart, inr, PREVIOUS } from "./charts";

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;

function Tile({ label, value, children, sub }: { label: string; value: string; children?: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-warm-gray bg-white p-4">
      <p className="text-sm text-secondary-text">{label}</p>
      <p className="font-display text-2xl leading-tight sm:text-3xl">{value}</p>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
        {children}
        {sub && <span className="text-sm text-secondary-text">{sub}</span>}
      </div>
    </div>
  );
}

function Card({ title, children, className = "", table }: { title: string; children: React.ReactNode; className?: string; table?: { head: string[]; rows: (string | number)[][] } }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`rounded-2xl border border-warm-gray bg-white p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="font-body text-lg font-semibold">{title}</h2>
        {table && (
          <button role="switch" aria-checked={asTable} onClick={() => setAsTable((v) => !v)} className="flex min-h-12 flex-shrink-0 items-center gap-2 text-sm text-secondary-text">
            Show as table
            <span className={`relative h-6 w-10 rounded-full transition-colors ${asTable ? "bg-success" : "bg-gray-300"}`} aria-hidden="true">
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${asTable ? "left-[1.125rem]" : "left-0.5"}`} />
            </span>
          </button>
        )}
      </div>
      {table && asTable ? (
        <div className="max-h-64 overflow-auto rounded-xl border border-warm-gray">
          <table className="w-full text-left text-base">
            <thead className="sticky top-0 bg-cream text-sm text-secondary-text"><tr>{table.head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-warm-gray/70">{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-1.5 tabular-nums">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export default function SalesPanel() {
  const [range, setRange] = useState<RangeId>("7d");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: RangeId) => {
    setLoading(true);
    try {
      setReport((await adminApi(`/api/admin/sales?range=${r}`)).report);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    load(range);
  }, [load, range]);

  const c = report?.current;
  const p = report?.previous;
  const empty = !!c && c.orders === 0 && c.cancelled === 0;

  const busiest = report?.byHour.reduce((b, h) => (h.orders > b.orders ? h : b), { hour: 0, orders: 0 });
  const bestDay = report?.byWeekday.reduce((b, d) => (d.revenue > b.revenue ? d : b), { day: "", orders: 0, revenue: 0, });
  const insights: string[] = [];
  if (report && c && c.orders > 0) {
    if (busiest && busiest.orders > 0) insights.push(`Busiest hour: ${hourLabel(busiest.hour).replace("a", " AM").replace("p", " PM")} (${busiest.orders} order${busiest.orders === 1 ? "" : "s"}).`);
    if (report.range.days > 1 && bestDay && bestDay.revenue > 0) insights.push(`Best weekday: ${bestDay.day} (${inr(bestDay.revenue)}).`);
    if (report.products[0]) insights.push(`Top product: ${report.products[0].name} (${inr(report.products[0].revenue)}).`);
    if (c.customers > 0) insights.push(`${Math.round((c.returningCustomers / c.customers) * 100)}% of customers (${c.returningCustomers} of ${c.customers}) had ordered before.`);
    if (c.cancelRate >= 0.15) insights.push(`${Math.round(c.cancelRate * 100)}% of orders were cancelled. Check the cancelled orders for dummy or unreachable customers.`);
  }

  const pctOf = (n: number, d: number) => (d > 0 ? ` · ${Math.round((n / d) * 100)}%` : "");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl sm:text-3xl">Sales</h1>
      <p className="mb-4 text-base text-secondary-text">
        Cancelled orders are not counted as sales. Totals include delivery charges. Orders are paid on delivery.
      </p>

      <div className="mb-1 flex gap-2 overflow-x-auto" role="group" aria-label="Date range">
        {RANGE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setRange(id)}
            aria-pressed={range === id}
            className={`min-h-12 whitespace-nowrap rounded-full border px-5 text-base font-medium ${range === id ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`}
          >
            {RANGE_LABEL[id]}
          </button>
        ))}
      </div>
      <p className="mb-5 min-h-6 text-base text-secondary-text">{report ? `Compared with ${report.range.prevLabel.charAt(0).toLowerCase()}${report.range.prevLabel.slice(1)}.` : ""}</p>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {!report ? (
        <p className="text-base text-secondary-text">{loading ? "Loading…" : "No data."}</p>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Sales" value={inr(c!.revenue)}><Delta now={c!.revenue} before={p!.revenue} /></Tile>
            <Tile label="Orders" value={String(c!.orders)}><Delta now={c!.orders} before={p!.orders} /></Tile>
            <Tile label="Average order" value={inr(c!.aov)}><Delta now={c!.aov} before={p!.aov} /></Tile>
            <Tile label="Cancelled" value={`${Math.round(c!.cancelRate * 100)}%`} sub={`${c!.cancelled} order${c!.cancelled === 1 ? "" : "s"}`}>
              <Delta now={c!.cancelRate * 100} before={p!.cancelRate * 100} goodWhenUp={false} />
            </Tile>
          </section>

          {empty ? (
            <p className="mb-5 rounded-2xl border border-warm-gray bg-white p-6 text-center text-base text-secondary-text">No orders in this period. Pick a longer range, or check back after orders come in.</p>
          ) : (
            <>
              {/* The plain-language reading comes first; the charts explain it. */}
              {insights.length > 0 && (
                <Card title="What stands out" className="mb-5">
                  <ul className="space-y-1.5 text-base">
                    {insights.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </Card>
              )}

              <Card
                title={report.granularity === "hour" ? "How did today go, hour by hour?" : "How are sales moving day by day?"}
                className="mb-5"
                table={{
                  head: [report.granularity === "hour" ? "Hour" : "Day", "Sales", "Orders", "Sales before", "Orders before"],
                  rows: report.series.map((b) => [b.label, inr(b.revenue), b.orders, inr(b.prevRevenue), b.prevOrders]),
                }}
              >
                <div className="mb-3 flex gap-2">
                  {(["revenue", "orders"] as const).map((m) => (
                    <button key={m} onClick={() => setMetric(m)} aria-pressed={metric === m} className={`min-h-12 rounded-full border px-5 text-base font-medium ${metric === m ? "border-primary-text bg-primary-text text-white" : "border-warm-gray text-secondary-text"}`}>
                      {m === "revenue" ? "Sales ₹" : "Orders"}
                    </button>
                  ))}
                </div>
                <TrendChart series={report.series} metric={metric} prevLabel={report.range.prevLabel} />
                <p className="mt-2 text-sm" style={{ color: PREVIOUS }}>The line is {report.range.prevLabel.toLowerCase()}.</p>
              </Card>

              <div className="mb-5 grid gap-5 lg:grid-cols-2">
                <Card title="When do orders come in?" table={{ head: ["Hour", "Orders"], rows: report.byHour.map((h) => [hourLabel(h.hour), h.orders]) }}>
                  <MiniBars caption="Orders by hour of day" labelEvery={3} data={report.byHour.map((h) => ({ label: hourLabel(h.hour), value: h.orders, display: `${h.orders} order${h.orders === 1 ? "" : "s"}` }))} />
                </Card>
                <Card title="Which days are busiest?" table={{ head: ["Day", "Sales", "Orders"], rows: report.byWeekday.map((d) => [d.day, inr(d.revenue), d.orders]) }}>
                  <MiniBars caption="Sales by weekday" data={report.byWeekday.map((d) => ({ label: d.day, value: d.revenue, display: `${inr(d.revenue)} · ${d.orders} order${d.orders === 1 ? "" : "s"}` }))} />
                </Card>
                <Card title="What sells most?" table={{ head: ["Product", "Sales", "Orders"], rows: report.products.map((r) => [r.name, inr(r.revenue), r.orders]) }}>
                  <RankedBars rows={report.products} empty="No sales yet." />
                  <p className="mt-3 text-sm text-secondary-text">Grey tick = same product {report.range.prevLabel.toLowerCase()}.</p>
                </Card>
                <Card title="Where does the money come from?" table={{ head: ["Category", "Sales", "Orders"], rows: report.categories.map((r) => [r.name, inr(r.revenue), r.orders]) }}>
                  <RankedBars rows={report.categories} empty="No sales yet." />
                </Card>
                <Card title="Which delivery slots do customers pick?" table={{ head: ["Slot", "Orders"], rows: report.slots.map((s) => [s.slot, s.orders]) }}>
                  <HBars rows={report.slots.map((s) => ({ name: s.slot, value: s.orders }))} empty="No orders yet." />
                </Card>
                <Card title="Are customers coming back?" table={{ head: ["Customers", "Count"], rows: [["First-time", c!.newCustomers], ["Returning", c!.returningCustomers]] }}>
                  <HBars
                    rows={[
                      { name: "First-time customers", value: c!.newCustomers, note: pctOf(c!.newCustomers, c!.customers).replace(" · ", "") },
                      { name: "Returning customers", value: c!.returningCustomers, note: pctOf(c!.returningCustomers, c!.customers).replace(" · ", "") },
                    ]}
                    empty="No customers yet."
                  />
                  <p className="mt-3 text-sm text-secondary-text">Customers are counted by phone number. {c!.itemsPerOrder > 0 && `Average basket: ${c!.itemsPerOrder.toFixed(1)} items.`}</p>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
