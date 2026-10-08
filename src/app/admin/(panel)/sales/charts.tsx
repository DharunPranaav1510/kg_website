"use client";

import { useState } from "react";
import { pctChange, type Bucket, type Ranked } from "@/lib/sales";

// Chart colours: the shop's brand colour for "this period", a quiet neutral for
// the comparison. Identity never relies on colour alone: the comparison is a
// line, the current period is bars, and both are in the legend.
export const CURRENT = "#D63E0A";
export const PREVIOUS = "#8a867d";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const compact = (n: number) =>
  n >= 100000 ? `${+(n / 100000).toFixed(1)}L` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(Math.round(n));

function niceMax(v: number) {
  if (v <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * pow;
}

/** "▲ 12%" with a word, never colour alone. `goodWhenUp=false` flips what counts as good. */
export function Delta({ now, before, goodWhenUp = true, unit = "%" }: { now: number; before: number; goodWhenUp?: boolean; unit?: "%" | "pts" }) {
  const pct = pctChange(now, before);
  if (pct === null) return <span className="text-sm font-medium text-secondary-text">▲ new</span>;
  if (Math.abs(pct) < 0.5) return <span className="text-sm font-medium text-secondary-text">▬ no change</span>;
  const up = pct > 0;
  const good = up === goodWhenUp;
  return (
    <span className={`text-sm font-semibold ${good ? "text-success" : "text-red-600"}`}>
      {up ? "▲ up" : "▼ down"} {Math.abs(Math.round(pct))}
      {unit}
    </span>
  );
}

/** Bars for this period (<=24px, rounded data-end), line for the comparison period. */
export function TrendChart({
  series,
  metric,
  prevLabel,
}: {
  series: Bucket[];
  metric: "revenue" | "orders";
  prevLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 260;
  const m = { l: 46, r: 12, t: 12, b: 30 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const cur = (b: Bucket) => (metric === "revenue" ? b.revenue : b.orders);
  const prev = (b: Bucket) => (metric === "revenue" ? b.prevRevenue : b.prevOrders);
  const max = niceMax(Math.max(...series.map((b) => Math.max(cur(b), prev(b))), 0));
  const slot = iw / Math.max(series.length, 1);
  const barW = Math.max(2, Math.min(24, slot - 2));
  const x = (i: number) => m.l + slot * i + slot / 2;
  const y = (v: number) => m.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.ceil(series.length / 7);
  const fmt = (v: number) => (metric === "revenue" ? inr(v) : String(v));
  const linePath = series.map((b, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(prev(b)).toFixed(1)}`).join(" ");
  const r = Math.min(4, barW / 2);

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-secondary-text">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: CURRENT }} /> This period</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ background: PREVIOUS }} /> {prevLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${metric === "revenue" ? "Revenue" : "Orders"} over time compared with ${prevLabel}`} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="#e8e4dc" strokeWidth="1" />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5a5a5a">{metric === "revenue" ? `₹${compact(t)}` : compact(t)}</text>
          </g>
        ))}
        {series.map((b, i) => {
          const h = Math.max(0, (cur(b) / max) * ih);
          const top = y(cur(b));
          const bx = x(i) - barW / 2;
          return h > 0 ? (
            // Rounded data-end, square at the baseline.
            <path
              key={i}
              d={`M${bx},${m.t + ih} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + barW - r} Q${bx + barW},${top} ${bx + barW},${top + r} V${m.t + ih} Z`}
              fill={CURRENT}
              opacity={hover === null || hover === i ? 1 : 0.55}
            />
          ) : null;
        })}
        <path d={linePath} fill="none" stroke={PREVIOUS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <circle cx={x(hover)} cy={y(prev(series[hover]))} r="4.5" fill={PREVIOUS} stroke="#fff" strokeWidth="2" />
        )}
        {series.map((b, i) =>
          i % every === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#5a5a5a">{b.label.replace(/^\w+ /, "")}</text>
          ) : null
        )}
        {/* Wide invisible hit areas so thin bars are easy to hover or tap */}
        {series.map((_, i) => (
          <rect key={i} x={m.l + slot * i} y={m.t} width={slot} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-6 z-10 -translate-x-1/2 rounded-xl bg-primary-text px-3 py-2 text-xs text-white shadow-hover"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <p className="font-semibold">{series[hover].label}</p>
          <p><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: CURRENT }} />{fmt(cur(series[hover]))}</p>
          <p className="text-white/70"><span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "#c9c5bb" }} />{fmt(prev(series[hover]))} before</p>
        </div>
      )}
    </div>
  );
}

/** Small single-series column chart (orders by hour / weekday). */
export function MiniBars({
  data,
  labelEvery = 1,
  caption,
}: {
  data: { label: string; value: number; display?: string }[];
  labelEvery?: number;
  caption: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={caption}>
        {data.map((d, i) => (
          <div key={i} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
            <div
              className="w-full rounded-t-[4px]"
              style={{
                height: `${Math.max(d.value ? 4 : 1, (d.value / max) * 100)}%`,
                background: CURRENT,
                opacity: d.value === 0 ? 0.2 : i === top || hover === i ? 1 : 0.55,
                maxWidth: 24,
                margin: "0 auto",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] text-xs text-secondary-text">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">{i % labelEvery === 0 ? d.label : ""}</span>
        ))}
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-primary-text px-2.5 py-1.5 text-xs text-white shadow-hover" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
          {data[hover].label}: {data[hover].display ?? data[hover].value}
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with a tick for the previous period's value. */
export function RankedBars({ rows, empty }: { rows: Ranked[]; empty: string }) {
  if (rows.length === 0) return <p className="py-4 text-center text-sm text-secondary-text">{empty}</p>;
  const max = Math.max(...rows.map((r) => Math.max(r.revenue, r.prevRevenue)), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.name}</span>
            <span className="flex flex-shrink-0 items-baseline gap-2">
              <b>{inr(r.revenue)}</b>
              <Delta now={r.revenue} before={r.prevRevenue} />
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-warm-gray/50">
            <div className="h-3 rounded-full" style={{ width: `${(r.revenue / max) * 100}%`, background: CURRENT }} />
            {r.prevRevenue > 0 && (
              <div
                className="absolute -top-0.5 h-4 w-0.5 rounded"
                style={{ left: `calc(${(r.prevRevenue / max) * 100}% - 1px)`, background: PREVIOUS }}
                title={`Before: ${inr(r.prevRevenue)}`}
              />
            )}
          </div>
          <p className="mt-0.5 text-sm text-secondary-text">{r.orders} order{r.orders === 1 ? "" : "s"}</p>
        </li>
      ))}
    </ul>
  );
}


/** Plain horizontal bars for a short list of counts (delivery slots, new vs returning). */
export function HBars({ rows, empty, format }: { rows: { name: string; value: number; note?: string }[]; empty: string; format?: (n: number) => string }) {
  if (rows.length === 0 || rows.every((r) => r.value === 0)) return <p className="py-4 text-center text-base text-secondary-text">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-base">
            <span className="min-w-0 truncate font-medium">{r.name}</span>
            <span className="flex-shrink-0 tabular-nums"><b>{format ? format(r.value) : r.value}</b>{r.note && <span className="ml-2 text-sm text-secondary-text">{r.note}</span>}</span>
          </div>
          <div className="h-3 rounded-full bg-warm-gray/50">
            <div className="h-3 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: CURRENT }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
