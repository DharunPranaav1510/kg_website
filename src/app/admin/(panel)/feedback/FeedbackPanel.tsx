"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { adminApi } from "../../api";
import { useOrderActions } from "../../orderActions";
import OrderPanel from "../../OrderPanel";
import { dayDate, clock, useUi } from "../../ui";
import type { CustomerHistory, Order, OrdersResponse } from "../../orderUtils";

interface Row {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  order: { id: string; number: number; name: string; phone: string; items: string[] } | null;
}
interface Summary { count: number; average: number; spread: { stars: number; count: number }[] }

const PUBLISHED_KEY = "kg-admin-feedback-published";
const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <span className="inline-flex gap-0.5" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= n ? "fill-amber-400 text-amber-400" : "text-warm-gray"} />)}
  </span>
);

type Filter = "all" | "comments" | "low";

export default function FeedbackPanel() {
  const { toast, confirm } = useUi();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [only, setOnly] = useState<Filter>("all");
  const [star, setStar] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [published, setPublished] = useState<Set<string>>(new Set());

  // The order panel opens from an order number.
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [history, setHistory] = useState<Record<string, CustomerHistory>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/feedback");
      setRows(d.feedback);
      setSummary(d.summary);
    } catch (e) {
      setError((e as Error).message);
      setRows((r) => r ?? []);
    }
  }, []);
  useEffect(() => {
    load();
    try {
      setPublished(new Set(JSON.parse(localStorage.getItem(PUBLISHED_KEY) ?? "[]")));
    } catch {
      /* ignore */
    }
  }, [load]);

  const loadOrders = useCallback(async () => {
    try {
      const r = (await adminApi("/api/admin/orders?limit=1000")) as OrdersResponse;
      setOrders(r.orders);
      setHistory(r.history);
      setBlocked(r.blocked);
    } catch (e) {
      toast({ text: `Could not load the order. ${(e as Error).message}`, tone: "error" });
    }
  }, [toast]);
  const { changeStatus, block, unblock } = useOrderActions(setOrders, loadOrders);

  async function openOrder(id: string) {
    if (!orders) await loadOrders();
    setOpenId(id);
  }

  async function publish(r: Row) {
    const first = (r.order?.name ?? "Customer").trim().split(/\s+/)[0];
    const res = await confirm({
      title: "Show this on the website?",
      body: `It will look like this: “${r.comment}” — ${first}, ${r.rating} stars. Only the first name is shown.`,
      confirmLabel: "Publish review",
      cancelLabel: "Not now",
    });
    if (res.choice !== "confirm") return;
    try {
      await adminApi(`/api/admin/feedback/${r.id}`, { method: "POST" });
      const next = new Set(published).add(r.id);
      setPublished(next);
      try {
        localStorage.setItem(PUBLISHED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      toast({ text: "Added to the reviews on your website.", action: { label: "Edit reviews", href: "/admin/content" }, ms: 8000 });
    } catch (e) {
      toast({ text: `Could not publish. ${(e as Error).message}`, tone: "error", retry: () => publish(r) });
    }
  }

  const shown = (rows ?? []).filter((r) => (only === "low" ? r.rating <= 2 : only === "comments" ? !!r.comment : true) && (star === null || r.rating === star));
  const chip = (on: boolean) => `min-h-12 whitespace-nowrap rounded-full border px-5 text-base font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;
  const openOrderObj = openId ? orders?.find((o) => o.id === openId) ?? null : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Feedback</h1>
        <p className="text-base text-secondary-text">Ratings customers leave on their order page after delivery.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {summary && summary.count > 0 && (
        <section className="grid gap-4 rounded-2xl border border-warm-gray bg-white p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="text-center sm:pr-6">
            <p className="font-display text-5xl tabular-nums">{summary.average.toFixed(1)}</p>
            <Stars n={Math.round(summary.average)} size={20} />
            <p className="mt-1 text-base text-secondary-text">{summary.count} {summary.count === 1 ? "rating" : "ratings"}</p>
          </div>
          <ul className="space-y-1">
            {summary.spread.map((s) => (
              <li key={s.stars}>
                <button onClick={() => setStar(star === s.stars ? null : s.stars)} aria-pressed={star === s.stars} className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-2 text-base ${star === s.stars ? "bg-amber-50" : "hover:bg-cream"}`}>
                  <span className="w-8 text-right">{s.stars}★</span>
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-warm-gray"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${(s.count / summary.count) * 100}%` }} /></span>
                  <span className="w-8 text-right tabular-nums text-secondary-text">{s.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter">
        <button className={chip(only === "all")} aria-pressed={only === "all"} onClick={() => setOnly("all")}>All</button>
        <button className={chip(only === "comments")} aria-pressed={only === "comments"} onClick={() => setOnly("comments")}>With comments</button>
        <button className={chip(only === "low")} aria-pressed={only === "low"} onClick={() => setOnly("low")}>Low ratings</button>
        {star !== null && <button className={chip(true)} onClick={() => setStar(null)}>{star} stars ✕</button>}
      </div>

      {rows === null ? (
        <p className="py-8 text-center text-base text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-warm-gray p-8 text-center text-base text-secondary-text">
          {rows.length === 0 ? "No feedback yet. It appears here after customers rate a delivered order." : "No feedback matches this filter."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const first = r.order ? r.order.name.trim().split(/\s+/)[0] : "Customer";
            return (
              <li key={r.id} className="rounded-2xl border border-warm-gray bg-white p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars n={r.rating} />
                  <span className="text-base font-semibold">{first}</span>
                  <span className="ml-auto text-sm text-secondary-text">{dayDate(r.created_at)}, {clock(r.created_at)}</span>
                </div>
                {r.comment ? <p className="mt-2 text-base">“{r.comment}”</p> : <p className="mt-2 text-base italic text-secondary-text">No comment</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-base">
                  {r.order && <button onClick={() => openOrder(r.order!.id)} className="min-h-12 font-medium text-accent hover:underline">Order #{r.order.number}</button>}
                  {r.order && <span className="text-sm text-secondary-text">{r.order.items.join(", ")}</span>}
                  <span className="ml-auto flex items-center gap-2">
                    {published.has(r.id) && (
                      <Link href="/admin/content" className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">On website →</Link>
                    )}
                    {r.comment && !published.has(r.id) && r.rating >= 4 && (
                      <button onClick={() => publish(r)} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Show on the website</button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <OrderPanel order={openOrderObj} history={history} blocked={blocked} now={Date.now()} onClose={() => setOpenId(null)} onStatus={(o, st) => changeStatus(o, st)} onBlock={block} onUnblock={unblock} />
    </div>
  );
}
