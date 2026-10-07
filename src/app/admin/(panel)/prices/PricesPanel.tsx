"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopCategories } from "@/data/products";
import { adminApi } from "../../api";
import { SidePanel, rupees, useUi } from "../../ui";

interface Row {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  image: string;
  isEgg?: boolean;
  inStock?: boolean;
  active: boolean;
}

const categories = shopCategories.filter((c) => c !== "All");
type Rounding = 1 | 5 | 10;
const MAX_CHANGES = 200;
const WARN_FROM = 150;

function roundTo(n: number, step: Rounding) {
  return Math.max(0, Math.round(n / step) * step);
}

export default function PricesPanel() {
  const { toast } = useUi();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({}); // id -> new price
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // bulk-adjust tool
  const [mode, setMode] = useState<"up" | "down">("up");
  const [unit, setUnit] = useState<"percent" | "rupees">("percent");
  const [amount, setAmount] = useState("5");
  const [rounding, setRounding] = useState<Rounding>(5);
  const [toolOpen, setToolOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows((await adminApi("/api/admin/products")).products);
    } catch (e) {
      setError((e as Error).message);
      setRows((p) => p ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (rows ?? []).filter((r) => (cat === "All" || r.category === cat) && r.name.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, cat, query]
  );

  const priceOf = (r: Row) => (draft[r.id] !== undefined ? Number(draft[r.id]) : r.pricePerKg);
  const priceChanged = (r: Row) => draft[r.id] !== undefined && Number(draft[r.id]) !== r.pricePerKg;
  const invalid = (r: Row) => draft[r.id] !== undefined && (draft[r.id] === "" || !Number.isFinite(Number(draft[r.id])) || Number(draft[r.id]) < 0);
  const changedRows = (rows ?? []).filter(priceChanged);
  const hasInvalid = (rows ?? []).some(invalid);
  const atLimit = changedRows.length >= MAX_CHANGES;

  function setPrice(r: Row, value: string) {
    setDraft((d) => {
      if (value !== "" && Number(value) === r.pricePerKg) {
        const { [r.id]: _drop, ...rest } = d;
        return rest;
      }
      // The limit of 200 per save: no new edits beyond it.
      if (d[r.id] === undefined && Object.keys(d).length >= MAX_CHANGES) return d;
      return { ...d, [r.id]: value };
    });
  }

  const adjusted = (r: Row) => {
    const n = Number(amount);
    const base = priceOf(r);
    const raw = unit === "percent" ? base * (1 + (mode === "up" ? n : -n) / 100) : base + (mode === "up" ? n : -n);
    return roundTo(raw, rounding);
  };
  const adjustOk = Number.isFinite(Number(amount)) && Number(amount) > 0;

  function applyAdjust() {
    if (!adjustOk) return;
    setDraft((d) => {
      const next = { ...d };
      for (const r of visible) {
        const value = adjusted(r);
        if (value === r.pricePerKg) delete next[r.id];
        else if (next[r.id] !== undefined || Object.keys(next).length < MAX_CHANGES) next[r.id] = String(value);
      }
      return next;
    });
    setToolOpen(false);
    toast({ text: `Filled in new prices for ${visible.length} product${visible.length === 1 ? "" : "s"}. Review, then save.` });
  }

  async function saveAll() {
    if (hasInvalid || changedRows.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const updates = changedRows.map((r) => ({ id: r.id, pricePerKg: Number(draft[r.id]) }));
      await adminApi("/api/admin/products/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) });
      toast({ text: `${updates.length} price${updates.length === 1 ? "" : "s"} updated. Live in the shop now.`, action: { label: "Activity log", href: "/admin/activity" }, ms: 8000 });
      setDraft({});
      setReviewing(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
      toast({ text: `Prices were not saved. ${(e as Error).message}`, tone: "error", retry: saveAll });
    }
    setBusy(false);
  }

  /** The sold-out switch acts at once, with Undo. */
  async function setStock(r: Row, inStock: boolean, withUndo = true) {
    setRows((all) => all && all.map((x) => (x.id === r.id ? { ...x, inStock } : x)));
    try {
      await adminApi(`/api/admin/products/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inStock }) });
      if (withUndo) toast({ text: `${r.name} is now ${inStock ? "in stock" : "sold out"}.`, undo: () => setStock(r, !inStock, false) });
    } catch (e) {
      setRows((all) => all && all.map((x) => (x.id === r.id ? { ...x, inStock: !inStock } : x)));
      toast({ text: `${r.name} was not changed. ${(e as Error).message}`, tone: "error", retry: () => setStock(r, inStock, withUndo) });
    }
  }

  const chip = (on: boolean) =>
    `min-h-12 whitespace-nowrap rounded-full border px-4 text-base font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;
  const delta = (r: Row) => {
    const d = priceOf(r) - r.pricePerKg;
    const pct = r.pricePerKg > 0 ? (d / r.pricePerKg) * 100 : 0;
    return { d, text: `${d > 0 ? "+" : "−"}₹${Math.abs(d)} (${d > 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%)` };
  };
  const sel = "min-h-12 w-full rounded-xl border border-warm-gray bg-white px-3 text-base";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-2xl sm:text-3xl">Update prices</h1>
          <p className="text-base text-secondary-text">Type new prices, then Review and Save once. Nothing changes for customers until you save. Sold-out switches act at once.</p>
        </div>
        <button onClick={() => setToolOpen(true)} className="min-h-12 rounded-full border border-warm-gray bg-white px-5 text-base font-medium hover:bg-cream">Adjust many at once</button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      <div className="mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" className="min-h-12 w-full rounded-full border border-warm-gray bg-white px-4 text-base outline-none focus:border-accent" />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {["All", ...categories].map((c) => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={chip(cat === c)}>{c}</button>
        ))}
      </div>

      {rows === null ? (
        <p className="text-base text-secondary-text">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-warm-gray bg-white p-8 text-center text-base text-secondary-text">No products yet. Open <b>Products</b> and import the default products first.</p>
      ) : (
        <ul className="divide-y divide-warm-gray overflow-hidden rounded-2xl border border-warm-gray bg-white">
          {visible.map((r) => {
            const changed = priceChanged(r);
            const on = r.inStock !== false;
            const dl = delta(r);
            return (
              <li key={r.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4 ${changed ? "bg-amber-50" : ""} ${r.active ? "" : "opacity-60"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt="" className="hidden h-12 w-12 flex-shrink-0 rounded-xl bg-warm-gray object-cover sm:block" />
                <div className="min-w-0 flex-1 basis-32">
                  <p className="truncate text-base font-semibold">{r.name}</p>
                  <p className="text-sm text-secondary-text">Now {rupees(r.pricePerKg)} / {r.isEgg ? "dozen" : "kg"}</p>
                </div>

                <div className="flex flex-col items-end">
                  <label className={`flex items-center rounded-xl border bg-white px-3 ${invalid(r) ? "border-red-500" : changed ? "border-amber-500" : "border-warm-gray"}`}>
                    <span className="text-base text-secondary-text">₹</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      enterKeyHint="next"
                      value={draft[r.id] ?? String(r.pricePerKg)}
                      onChange={(e) => setPrice(r, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "ArrowDown") {
                          e.preventDefault();
                          const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-price]"));
                          inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
                        }
                      }}
                      data-price
                      aria-label={`New price of ${r.name}`}
                      className="min-h-12 w-24 bg-transparent text-right text-lg font-semibold tabular-nums outline-none"
                    />
                  </label>
                  <span className={`mt-0.5 min-h-5 text-sm font-semibold tabular-nums ${!changed ? "invisible" : dl.d > 0 ? "text-success" : "text-red-600"}`}>{changed ? dl.text : "·"}</span>
                </div>

                <button role="switch" aria-checked={on} aria-label={`${r.name}: ${on ? "In stock" : "Sold out"}`} onClick={() => setStock(r, !on)} className="flex min-h-12 items-center gap-2 rounded-full px-1">
                  <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-red-400"}`} aria-hidden="true">
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
                  </span>
                  <span className={`w-20 text-left text-base font-medium ${on ? "text-success" : "text-red-600"}`}>{on ? "In stock" : "Sold out"}</span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="p-6 text-center text-base text-secondary-text">No products match.</li>}
        </ul>
      )}

      {changedRows.length > 0 && (
        <div className="sticky bottom-[4.75rem] z-30 mt-4 rounded-2xl border border-warm-gray bg-white/95 px-4 py-3 shadow-hover backdrop-blur lg:bottom-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-[10rem] flex-1 text-base">
              <b>{changedRows.length} price{changedRows.length === 1 ? "" : "s"} changed</b>
              {hasInvalid && <span className="ml-2 text-red-600">Fix the red price first.</span>}
              {changedRows.length >= WARN_FROM && !atLimit && <span className="ml-2 text-amber-700">{changedRows.length} of {MAX_CHANGES} per save</span>}
              {atLimit && <span className="ml-2 text-red-600">Save these {MAX_CHANGES} first.</span>}
            </p>
            <button onClick={() => setDraft({})} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Discard</button>
            <button onClick={() => setReviewing(true)} disabled={hasInvalid} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream disabled:opacity-50">Review</button>
            <button onClick={saveAll} disabled={busy || hasInvalid} className="btn-primary min-h-12 !px-8 !text-base disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}

      {/* Review */}
      <SidePanel
        open={reviewing}
        onClose={() => setReviewing(false)}
        title={`Review ${changedRows.length} price${changedRows.length === 1 ? "" : "s"}`}
        subtitle="Customers will see these as soon as you save."
        footer={
          <div className="flex gap-3">
            <button onClick={() => setReviewing(false)} className="min-h-12 rounded-full border border-warm-gray px-6 text-base font-medium hover:bg-cream">Back</button>
            <button onClick={saveAll} disabled={busy || changedRows.length === 0} className="btn-primary ml-auto min-h-12 !px-8 !text-base disabled:opacity-50">{busy ? "Saving…" : `Save ${changedRows.length}`}</button>
          </div>
        }
      >
        {changedRows.length === 0 ? (
          <p className="text-base text-secondary-text">Nothing left to save.</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {changedRows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-base">
                <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                <span className="tabular-nums">{rupees(r.pricePerKg)} → <b>{rupees(priceOf(r))}</b></span>
                <button onClick={() => setPrice(r, String(r.pricePerKg))} aria-label={`Remove change to ${r.name}`} className="flex h-12 w-12 items-center justify-center rounded-full text-secondary-text hover:bg-warm-gray">✕</button>
              </li>
            ))}
          </ul>
        )}
      </SidePanel>

      {/* Adjust many at once */}
      <SidePanel
        open={toolOpen}
        onClose={() => setToolOpen(false)}
        title="Adjust many at once"
        subtitle={`Applies to the ${visible.length} product${visible.length === 1 ? "" : "s"} shown${cat !== "All" ? ` (${cat})` : ""}`}
        footer={<button onClick={applyAdjust} disabled={!adjustOk || visible.length === 0} className="btn-primary min-h-12 w-full !text-base disabled:opacity-50">Apply to table</button>}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium">1. Raise or lower</p>
            <div className="grid grid-cols-2 gap-2">
              {([["up", "Raise"], ["down", "Lower"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)} aria-pressed={mode === v} className={chip(mode === v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">2. By percent or by rupees</p>
            <div className="grid grid-cols-2 gap-2">
              {([["percent", "Percent (%)"], ["rupees", "Rupees (₹)"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setUnit(v)} aria-pressed={unit === v} className={chip(unit === v)}>{l}</button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">3. The amount
            <input type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${sel} mt-1`} />
          </label>
          <div>
            <p className="mb-1 text-sm font-medium">4. Round to the nearest</p>
            <div className="grid grid-cols-3 gap-2">
              {([1, 5, 10] as const).map((v) => (
                <button key={v} onClick={() => setRounding(v)} aria-pressed={rounding === v} className={chip(rounding === v)}>₹{v}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-cream p-3">
            <p className="mb-2 text-sm font-semibold">What it will do</p>
            {!adjustOk ? (
              <p className="text-base text-secondary-text">Enter an amount above zero.</p>
            ) : visible.length === 0 ? (
              <p className="text-base text-secondary-text">No products are shown.</p>
            ) : (
              <ul className="space-y-1 text-base">
                {visible.slice(0, 3).map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span className="truncate">{r.name}</span>
                    <span className="tabular-nums">{rupees(priceOf(r))} → <b>{rupees(adjusted(r))}</b></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-sm text-secondary-text">This only fills in the new price column. Nothing is saved until you press Save.</p>
        </div>
      </SidePanel>
    </div>
  );
}
