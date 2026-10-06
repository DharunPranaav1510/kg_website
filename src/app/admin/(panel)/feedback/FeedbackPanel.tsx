"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import { adminApi } from "../../api";

interface Row {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  order: { id: string; number: number; name: string; phone: string; items: string[] } | null;
}
interface Summary { count: number; average: number; spread: { stars: number; count: number }[] }

const Stars = ({ n, size = 15 }: { n: number; size?: number }) => (
  <span className="inline-flex gap-0.5" aria-label={`${n} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= n ? "fill-amber-400 text-amber-400" : "text-warm-gray"} />)}
  </span>
);

export default function FeedbackPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [only, setOnly] = useState<"all" | "low" | "comments">("all");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/feedback");
      setRows(d.feedback);
      setSummary(d.summary);
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
      setRows((r) => r ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function publish(r: Row) {
    if (!window.confirm("Show this on the website as a review (first name only)? If you have only sample reviews so far, they will be replaced by your real ones.")) return;
    try {
      await adminApi(`/api/admin/feedback/${r.id}`, { method: "POST" });
      setMsg({ tone: "ok", text: "Added to the reviews on your website. You can hide or edit it under Website content > Reviews." });
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    }
  }

  const shown = (rows ?? []).filter((r) => (only === "low" ? r.rating <= 3 : only === "comments" ? !!r.comment : true));
  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-xs font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Customer feedback</h1>
        <p className="text-sm text-secondary-text">Ratings customers leave on their order page after delivery.</p>
      </div>
      {msg && <p role={msg.tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${msg.tone === "ok" ? "bg-success/10 text-success" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      {summary && summary.count > 0 && (
        <section className="grid gap-4 rounded-2xl border border-warm-gray bg-white p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="text-center sm:pr-6">
            <p className="font-display text-5xl">{summary.average.toFixed(1)}</p>
            <Stars n={Math.round(summary.average)} size={18} />
            <p className="mt-1 text-xs text-secondary-text">{summary.count} {summary.count === 1 ? "rating" : "ratings"}</p>
          </div>
          <ul className="space-y-1.5">
            {summary.spread.map((s) => (
              <li key={s.stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right">{s.stars}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-warm-gray"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${(s.count / summary.count) * 100}%` }} /></span>
                <span className="w-6 text-secondary-text">{s.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2">
        <button className={chip(only === "all")} onClick={() => setOnly("all")}>All</button>
        <button className={chip(only === "low")} onClick={() => setOnly("low")}>3 stars or less</button>
        <button className={chip(only === "comments")} onClick={() => setOnly("comments")}>With a comment</button>
      </div>

      {rows === null ? (
        <p className="py-8 text-center text-sm text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-warm-gray p-8 text-center text-sm text-secondary-text">No feedback yet. It appears here after customers rate a delivered order.</p>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-warm-gray bg-white p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars n={r.rating} />
                <span className="text-sm font-medium">{r.order ? `Order #${r.order.number} · ${r.order.name}` : "Order removed"}</span>
                <span className="ml-auto text-xs text-secondary-text">{new Date(r.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span>
              </div>
              {r.comment ? <p className="mt-2 text-sm text-secondary-text">“{r.comment}”</p> : <p className="mt-2 text-xs italic text-secondary-text">No comment</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-secondary-text">
                {r.order && <span>{r.order.items.join(", ")}</span>}
                {r.order && <a href={`tel:${r.order.phone}`} className="font-medium text-accent hover:underline">📞 {formatPhone(r.order.phone)}</a>}
                {r.comment && r.rating >= 4 && <button onClick={() => publish(r)} className="ml-auto rounded-full border border-warm-gray px-3 py-1.5 font-medium text-primary-text hover:border-accent">Show on website</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
