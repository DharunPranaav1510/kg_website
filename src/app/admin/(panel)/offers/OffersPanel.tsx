"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Product } from "@/data/products";
import { offerActive, percentOff } from "@/lib/pricing";
import type { Movement } from "@/lib/movement";
import { adminApi } from "../../api";
import { rupees, useUi } from "../../ui";

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
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function OffersPanel() {
  const { toast } = useUi();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [days, setDays] = useState(30);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState(10);
  const [label, setLabel] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [sort, setSort] = useState<"slow" | "name">("slow");
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/offers");
      setRows(d.products);
      setDays(d.days);
    } catch (e) {
      setError((e as Error).message);
      setRows((r) => r ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => ["All", ...new Set((rows ?? []).map((r) => r.category))], [rows]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (rows ?? []).filter((r) => r.active && (cat === "All" || r.category === cat) && r.name.toLowerCase().includes(q));
    return sort === "slow"
      ? [...list].sort((a, b) => a.movement.qty - b.movement.qty || a.name.localeCompare(b.name))
      : [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, sort, cat, query]);

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const chosen = (rows ?? []).filter((r) => picked.has(r.id));
  const offerPriceOf = (r: Row) => Math.round(Number(r.pricePerKg) * (1 - percent / 100));
  const timeProblem =
    startsAt && endsAt && fromIst(startsAt) >= fromIst(endsAt) ? "The offer must end after it starts." : endsAt && fromIst(endsAt) < new Date().toISOString() ? "The end time is in the past." : "";

  async function apply() {
    setBusy(true);
    setError("");
    try {
      await adminApi("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...picked], percent, label, from: fromIst(startsAt), to: fromIst(endsAt) }),
      });
      toast({ text: `Offer applied to ${picked.size} product${picked.size === 1 ? "" : "s"}. Customers see it now.` });
      setPicked(new Set());
      await load();
    } catch (e) {
      setError((e as Error).message);
      toast({ text: `The offer was not applied. ${(e as Error).message}`, tone: "error", retry: apply });
    }
    setBusy(false);
  }

  async function remove(ids: string[]) {
    setBusy(true);
    try {
      await adminApi("/api/admin/offers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
      toast({ text: ids.length === 1 ? "Offer removed." : `${ids.length} offers removed.` });
      await load();
    } catch (e) {
      toast({ text: `Could not remove the offer. ${(e as Error).message}`, tone: "error" });
    }
    setBusy(false);
  }

  const withOffer = (rows ?? []).filter((r) => r.offer);
  const running = withOffer.filter((r) => offerActive(r));
  const scheduled = withOffer.filter((r) => !offerActive(r) && r.offer!.from && new Date(r.offer!.from).getTime() > Date.now());
  const chip = (on: boolean) => `min-h-12 rounded-full border px-4 text-base font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;
  const input = "min-h-12 w-full rounded-xl border border-warm-gray bg-white px-3 text-base outline-none focus:border-accent";

  const offerList = (list: Row[]) => (
    <ul className="divide-y divide-warm-gray/70">
      {list.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 py-2 text-base">
          <span className="min-w-0 flex-1">
            <b>{r.name}</b>{" "}
            <span className="text-secondary-text"><s>{rupees(r.pricePerKg)}</s> <b className="text-primary-text">{rupees(r.offer!.price)}</b></span>
            <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-sm font-semibold text-success">{percentOff(r)}% off</span>
            {r.offer!.label && <span className="ml-2 text-sm text-secondary-text">{r.offer!.label}</span>}
            <span className="mt-0.5 block text-sm text-secondary-text">
              {r.offer!.from && new Date(r.offer!.from).getTime() > Date.now() ? `Starts ${when(r.offer!.from)}` : ""}
              {r.offer!.to ? ` Ends ${when(r.offer!.to)}` : " No end date"}
            </span>
          </span>
          <button type="button" onClick={() => remove([r.id])} disabled={busy} className="inline-flex min-h-12 items-center gap-1 rounded-full border border-red-200 px-4 text-base text-red-600 hover:bg-red-50"><X size={16} /> Remove</button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Offers</h1>
        <p className="text-base text-secondary-text">Put slow-selling products on offer. The shop shows the old price crossed out.</p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      <section className="rounded-2xl border border-warm-gray bg-white p-4">
        <h2 className="mb-2 font-body text-lg font-semibold">Running now ({running.length})</h2>
        {running.length === 0 ? <p className="text-base text-secondary-text">No offers running. Create one below.</p> : offerList(running)}
        {scheduled.length > 0 && (
          <>
            <h3 className="mb-1 mt-4 font-body text-base font-semibold">Scheduled ({scheduled.length})</h3>
            {offerList(scheduled)}
          </>
        )}
      </section>

      {/* Step 1 */}
      <section className="rounded-2xl border border-warm-gray bg-white p-4">
        <h2 className="font-body text-lg font-semibold">Step 1 · Choose products</h2>
        <p className="mb-3 text-base text-secondary-text">Sales of the last {days} days, slowest first.</p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" className="min-h-12 min-w-[10rem] flex-1 rounded-full border border-warm-gray px-4 text-base outline-none focus:border-accent" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="min-h-12 rounded-full border border-warm-gray bg-white px-3 text-base" aria-label="Category">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button type="button" onClick={() => setSort(sort === "slow" ? "name" : "slow")} className={chip(sort === "slow")}>{sort === "slow" ? "Slowest first" : "A to Z"}</button>
          <button type="button" onClick={() => setPicked(new Set(shown.filter((r) => r.inStock !== false).slice(0, 5).map((r) => r.id)))} className="min-h-12 rounded-full border border-warm-gray px-4 text-base font-medium">Pick the 5 slowest</button>
        </div>

        {rows === null ? (
          <p className="py-6 text-center text-base text-secondary-text">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-base text-secondary-text">No products found. Import the default products on the Products page first.</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {shown.map((r) => (
              <li key={r.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
                  <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} className="h-6 w-6 flex-shrink-0 accent-accent" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg bg-warm-gray object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{r.name}</span>
                    <span className="block text-sm text-secondary-text">{r.category} · {rupees(r.pricePerKg)}/{r.isEgg ? "dz" : "kg"}{r.inStock === false ? " · sold out" : ""}</span>
                  </span>
                  <span className="text-right text-sm leading-tight text-secondary-text">
                    <b className="block text-base text-primary-text">{r.movement.qty % 1 ? r.movement.qty.toFixed(1) : r.movement.qty} {r.isEgg ? "dz" : "kg"}</b>
                    {r.movement.orders} {r.movement.orders === 1 ? "order" : "orders"} · {ago(r.movement.lastOrderedAt)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Step 2 */}
      <section className="rounded-2xl border border-warm-gray bg-white p-4">
        <h2 className="mb-3 font-body text-lg font-semibold">Step 2 · Set the offer</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="offer-percent">Percent off (1 to 90)</label>
            <div className="mt-1 flex items-center gap-3">
              <input id="offer-percent" type="number" min={1} max={90} inputMode="numeric" value={percent} onChange={(e) => setPercent(Math.min(90, Math.max(1, Number(e.target.value) || 1)))} className={`${input} w-28`} />
              <input type="range" min={1} max={90} value={percent} onChange={(e) => setPercent(Number(e.target.value))} aria-label="Percent off" className="h-12 flex-1 accent-accent" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">{PERCENTS.map((p) => <button key={p} type="button" onClick={() => setPercent(p)} className={chip(percent === p)}>{p}%</button>)}</div>
          </div>
          <label className="block text-sm font-medium">Label
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} placeholder={`Default: ${percent}% off`} className={`${input} mt-1`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Starts (Indian time), optional
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={`${input} mt-1`} />
            </label>
            <label className="block text-sm font-medium">Ends (Indian time), optional
              <input type="datetime-local" value={endsAt} min={istInput(0)} onChange={(e) => setEndsAt(e.target.value)} className={`${input} mt-1`} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-text">
            End in:
            {[["Today", 12], ["3 days", 72], ["1 week", 168]].map(([n, h]) => (
              <button key={n} type="button" onClick={() => setEndsAt(istInput(Number(h)))} className="min-h-12 rounded-full border border-warm-gray px-4 text-base text-primary-text">{n}</button>
            ))}
            {(startsAt || endsAt) && <button type="button" onClick={() => { setStartsAt(""); setEndsAt(""); }} className="min-h-12 px-3 text-base underline">Clear dates</button>}
          </div>
          {timeProblem && <p role="alert" className="text-base font-medium text-red-600">{timeProblem}</p>}
        </div>
      </section>

      {/* Step 3 */}
      <section className="rounded-2xl border border-warm-gray bg-white p-4">
        <h2 className="mb-1 font-body text-lg font-semibold">Step 3 · Check and apply</h2>
        <p className="mb-3 text-base text-secondary-text">This is what customers will see.</p>
        {chosen.length === 0 ? (
          <p className="rounded-xl bg-cream px-4 py-6 text-center text-base text-secondary-text">Choose at least one product in step 1.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {chosen.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-warm-gray p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt="" className="h-12 w-12 rounded-lg bg-warm-gray object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium">{r.name}</span>
                  <span className="block text-base tabular-nums"><s className="text-secondary-text">{rupees(r.pricePerKg)}</s> <b className="text-accent">{rupees(offerPriceOf(r))}</b> <span className="text-sm text-secondary-text">/ {r.isEgg ? "dozen" : "kg"}</span></span>
                </span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold text-white">{label || `${percent}% off`}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={apply} disabled={busy || picked.size === 0 || !!timeProblem} className="btn-primary mt-4 min-h-12 w-full !text-base disabled:opacity-50 sm:w-auto sm:!px-10">
          {busy ? "Applying…" : `Apply offer to ${picked.size} product${picked.size === 1 ? "" : "s"}`}
        </button>
      </section>
    </div>
  );
}
