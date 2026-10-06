"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Percent, Tag, X } from "lucide-react";
import type { Product } from "@/data/products";
import { offerActive, percentOff } from "@/lib/pricing";
import type { Movement } from "@/lib/movement";
import { adminApi } from "../../api";

type Row = Product & { active: boolean; movement: Movement };

const PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50];
const ago = (iso: string | null) => {
  if (!iso) return "not ordered";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};
const istInput = (offsetHours: number) => {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000 + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
};
const fromIst = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : "");

export default function OffersPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [days, setDays] = useState(30);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState(10);
  const [label, setLabel] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [sort, setSort] = useState<"slow" | "name">("slow");
  const [cat, setCat] = useState("All");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/offers");
      setRows(d.products);
      setDays(d.days);
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
      setRows((r) => r ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => ["All", ...new Set((rows ?? []).map((r) => r.category))], [rows]);
  const shown = useMemo(() => {
    const list = (rows ?? []).filter((r) => r.active && (cat === "All" || r.category === cat));
    return sort === "slow"
      ? [...list].sort((a, b) => a.movement.qty - b.movement.qty || a.name.localeCompare(b.name))
      : [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, sort, cat]);

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function apply() {
    setBusy(true);
    setMsg(null);
    try {
      await adminApi("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...picked], percent, label, to: fromIst(endsAt) }),
      });
      setMsg({ tone: "ok", text: `Offer applied to ${picked.size} product${picked.size === 1 ? "" : "s"}. Customers see it now.` });
      setPicked(new Set());
      await load();
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    }
    setBusy(false);
  }

  async function remove(ids: string[]) {
    setBusy(true);
    setMsg(null);
    try {
      await adminApi("/api/admin/offers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
      setMsg({ tone: "ok", text: "Offer removed." });
      await load();
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    }
    setBusy(false);
  }

  const live = (rows ?? []).filter((r) => r.offer);
  const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-sm font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-28">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Offers</h1>
        <p className="text-sm text-secondary-text">Put slow-selling products on offer. The offer shows on the shop with the old price crossed out.</p>
      </div>

      {msg && <p role={msg.tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${msg.tone === "ok" ? "bg-success/10 text-success" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      {live.length > 0 && (
        <section className="rounded-2xl border border-warm-gray bg-white p-4">
          <h2 className="mb-2 font-medium">Running now ({live.length})</h2>
          <ul className="divide-y divide-warm-gray/70">
            {live.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1">
                  <b>{r.name}</b>{" "}
                  <span className="text-secondary-text">₹{r.pricePerKg} → ₹{r.offer!.price}</span>
                  {offerActive(r) ? <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">{percentOff(r)}% off · live</span> : <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">scheduled or ended</span>}
                  {r.offer!.to && <span className="ml-2 text-xs text-secondary-text">until {new Date(r.offer!.to).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span>}
                </span>
                <button type="button" onClick={() => remove([r.id])} disabled={busy} className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"><X size={14} /> Remove</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-warm-gray bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-medium">Choose products <span className="text-sm font-normal text-secondary-text">· sales of the last {days} days</span></h2>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full border border-warm-gray bg-white px-3 py-2 text-sm" aria-label="Category">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button type="button" onClick={() => setSort(sort === "slow" ? "name" : "slow")} className={chip(sort === "slow")}>{sort === "slow" ? "Slowest first" : "A to Z"}</button>
          <button type="button" onClick={() => setPicked(new Set(shown.filter((r) => r.inStock !== false).slice(0, 5).map((r) => r.id)))} className="rounded-full border border-warm-gray px-3.5 py-2 text-sm font-medium">Pick the 5 slowest</button>
        </div>

        {rows === null ? (
          <p className="py-6 text-center text-sm text-secondary-text">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-secondary-text">No products in the database yet. Import the default products on the Products page first.</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {shown.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-3 py-3">
                  <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} className="h-5 w-5 flex-shrink-0 accent-accent" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg bg-warm-gray object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.name}</span>
                    <span className="block text-xs text-secondary-text">{r.category} · ₹{r.pricePerKg}/{r.isEgg ? "dz" : "kg"}{r.inStock === false ? " · sold out" : ""}</span>
                  </span>
                  <span className="text-right text-xs leading-tight text-secondary-text">
                    <b className="block text-sm text-primary-text">{r.movement.qty % 1 ? r.movement.qty.toFixed(1) : r.movement.qty} {r.isEgg ? "dz" : "kg"}</b>
                    {r.movement.orders} {r.movement.orders === 1 ? "order" : "orders"} · {ago(r.movement.lastOrderedAt)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-warm-gray bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium"><Tag size={16} className="text-accent" /> {picked.size} selected</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <Percent size={15} className="text-secondary-text" />
            {PERCENTS.map((p) => <button key={p} type="button" onClick={() => setPercent(p)} className={chip(percent === p)}>{p}%</button>)}
          </span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} placeholder={`Label (default "${percent}% off")`} className="min-w-[10rem] flex-1 rounded-full border border-warm-gray px-4 py-2 text-sm" />
          <span className="flex items-center gap-1.5 text-xs text-secondary-text">
            Ends
            <input type="datetime-local" value={endsAt} min={istInput(0)} onChange={(e) => setEndsAt(e.target.value)} className="rounded-full border border-warm-gray px-3 py-2 text-sm" aria-label="Offer ends (Indian time)" />
            {[["Today", 12], ["3 days", 72], ["1 week", 168]].map(([n, h]) => (
              <button key={n} type="button" onClick={() => setEndsAt(istInput(Number(h)))} className="rounded-full border border-warm-gray px-2.5 py-1.5">{n}</button>
            ))}
          </span>
          <button type="button" onClick={apply} disabled={busy || picked.size === 0} className="btn-primary !px-6 !py-2.5 disabled:opacity-50">Apply offer</button>
        </div>
      </div>
    </div>
  );
}
