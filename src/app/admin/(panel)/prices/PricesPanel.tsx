"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopCategories } from "@/data/products";
import { adminApi } from "../../api";

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

function roundTo(n: number, step: Rounding) {
  return Math.max(0, Math.round(n / step) * step);
}

export default function PricesPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({}); // id -> new price
  const [stock, setStock] = useState<Record<string, boolean>>({}); // id -> new in-stock
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
    () =>
      (rows ?? []).filter(
        (r) => (cat === "All" || r.category === cat) && r.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [rows, cat, query]
  );

  const priceOf = (r: Row) => (draft[r.id] !== undefined ? Number(draft[r.id]) : r.pricePerKg);
  const priceChanged = (r: Row) => draft[r.id] !== undefined && Number(draft[r.id]) !== r.pricePerKg;
  const stockOf = (r: Row) => stock[r.id] ?? r.inStock !== false;
  const stockChanged = (r: Row) => stock[r.id] !== undefined && stock[r.id] !== (r.inStock !== false);
  const invalid = (r: Row) => draft[r.id] !== undefined && (draft[r.id] === "" || !Number.isFinite(Number(draft[r.id])) || Number(draft[r.id]) < 0);

  const changedRows = (rows ?? []).filter((r) => priceChanged(r) || stockChanged(r));
  const hasInvalid = (rows ?? []).some(invalid);

  function setPrice(r: Row, value: string) {
    setNotice("");
    setDraft((d) => {
      if (value !== "" && Number(value) === r.pricePerKg) {
        const { [r.id]: _drop, ...rest } = d;
        return rest;
      }
      return { ...d, [r.id]: value };
    });
  }

  function nudge(r: Row, delta: number) {
    setPrice(r, String(Math.max(0, priceOf(r) + delta)));
  }

  function applyAdjust() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setNotice("");
    setDraft((d) => {
      const next = { ...d };
      for (const r of visible) {
        const base = priceOf(r);
        const raw = unit === "percent" ? base * (1 + (mode === "up" ? n : -n) / 100) : base + (mode === "up" ? n : -n);
        const value = roundTo(raw, rounding);
        if (value === r.pricePerKg) delete next[r.id];
        else next[r.id] = String(value);
      }
      return next;
    });
  }

  async function saveAll() {
    if (hasInvalid || changedRows.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const updates = changedRows.map((r) => ({
        id: r.id,
        ...(priceChanged(r) ? { pricePerKg: Number(draft[r.id]) } : {}),
        ...(stockChanged(r) ? { inStock: stock[r.id] } : {}),
      }));
      await adminApi("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      setNotice(`Saved ${updates.length} change${updates.length === 1 ? "" : "s"}. Customers see the new prices now.`);
      setDraft({});
      setStock({});
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const chip = (on: boolean) =>
    `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium ${
      on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"
    }`;

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <h1 className="font-display text-2xl sm:text-3xl">Update prices</h1>
      <p className="mb-4 text-sm text-secondary-text">
        Type a new price (or use − / +), then press <b>Save changes</b> once. Nothing changes for customers until you save.
      </p>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-3 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">✓ {notice}</p>}

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="min-w-[12rem] flex-1 rounded-full border border-warm-gray bg-white px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <button onClick={() => setToolOpen(!toolOpen)} className={chip(toolOpen)}>% Adjust many at once</button>
      </div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {["All", ...categories].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>{c}</button>
        ))}
      </div>

      {toolOpen && (
        <div className="mb-4 rounded-2xl border border-warm-gray bg-white p-4">
          <p className="mb-3 text-sm font-medium">
            Adjust the {visible.length} product{visible.length === 1 ? "" : "s"} shown below{cat !== "All" ? ` (${cat})` : ""}
          </p>
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label>
              <span className="mb-1 block text-xs text-secondary-text">Change</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as "up" | "down")} className="rounded-xl border border-warm-gray px-3 py-2">
                <option value="up">Increase by</option>
                <option value="down">Decrease by</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-secondary-text">Amount</span>
              <input type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 rounded-xl border border-warm-gray px-3 py-2" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-secondary-text">In</span>
              <select value={unit} onChange={(e) => setUnit(e.target.value as "percent" | "rupees")} className="rounded-xl border border-warm-gray px-3 py-2">
                <option value="percent">percent (%)</option>
                <option value="rupees">rupees (₹)</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-secondary-text">Round to nearest</span>
              <select value={rounding} onChange={(e) => setRounding(Number(e.target.value) as Rounding)} className="rounded-xl border border-warm-gray px-3 py-2">
                <option value={1}>₹1</option>
                <option value={5}>₹5</option>
                <option value={10}>₹10</option>
              </select>
            </label>
            <button onClick={applyAdjust} className="btn-primary !py-2.5 !px-5 !text-sm">Preview</button>
          </div>
          <p className="mt-2 text-xs text-secondary-text">This only fills in the new prices below. You can still edit them, then Save.</p>
        </div>
      )}

      {rows === null ? (
        <p className="text-secondary-text">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-warm-gray bg-white p-8 text-center text-secondary-text">
          No products in the database yet. Open <b>Products</b> and import the default products first.
        </p>
      ) : (
        <ul className="divide-y divide-warm-gray overflow-hidden rounded-2xl border border-warm-gray bg-white">
          {visible.map((r) => {
            const changed = priceChanged(r);
            const diff = priceOf(r) - r.pricePerKg;
            const pct = r.pricePerKg > 0 ? Math.round((diff / r.pricePerKg) * 100) : 0;
            return (
              <li key={r.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4 ${changed || stockChanged(r) ? "bg-amber-50/60" : ""} ${r.active ? "" : "opacity-50"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl bg-warm-gray object-cover" />
                <div className="min-w-0 flex-1 basis-36">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-secondary-text">
                    {r.category} · now ₹{r.pricePerKg}/{r.isEgg ? "dozen" : "kg"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => nudge(r, -5)} className="h-9 w-9 rounded-full border border-warm-gray text-lg leading-none hover:border-accent/40" aria-label={`Decrease ${r.name} by 5 rupees`}>−</button>
                  <div className={`flex items-center rounded-xl border bg-white px-2 ${invalid(r) ? "border-red-400" : changed ? "border-amber-400" : "border-warm-gray"}`}>
                    <span className="text-sm text-secondary-text">₹</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={draft[r.id] ?? String(r.pricePerKg)}
                      onChange={(e) => setPrice(r, e.target.value)}
                      aria-label={`New price of ${r.name}`}
                      className="w-[4.5rem] bg-transparent py-2 text-right text-base font-semibold outline-none"
                    />
                  </div>
                  <button onClick={() => nudge(r, 5)} className="h-9 w-9 rounded-full border border-warm-gray text-lg leading-none hover:border-accent/40" aria-label={`Increase ${r.name} by 5 rupees`}>+</button>
                </div>

                <span className={`w-16 text-right text-xs font-semibold ${!changed ? "text-transparent" : diff > 0 ? "text-red-600" : "text-success"}`} aria-hidden={!changed}>
                  {changed ? `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}${r.pricePerKg > 0 ? ` (${Math.abs(pct)}%)` : ""}` : "·"}
                </span>

                <button
                  onClick={() => { setNotice(""); setStock((s) => ({ ...s, [r.id]: !stockOf(r) })); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${stockOf(r) ? "bg-success/10 text-success" : "bg-red-100 text-red-700"}`}
                  aria-pressed={!stockOf(r)}
                >
                  {stockOf(r) ? "In stock" : "Sold out"}
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="p-6 text-center text-sm text-secondary-text">No products match.</li>}
        </ul>
      )}

      {changedRows.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-warm-gray bg-white/95 px-4 py-3 shadow-hover backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <p className="flex-1 text-sm">
              <b>{changedRows.length}</b> unsaved change{changedRows.length === 1 ? "" : "s"}
              {hasInvalid && <span className="ml-2 text-red-600">Fix the highlighted price first.</span>}
            </p>
            <button onClick={() => { setDraft({}); setStock({}); }} className="btn-secondary !py-2 !px-4 !text-xs">Discard</button>
            <button onClick={saveAll} disabled={busy || hasInvalid} className="btn-primary !py-2.5 !px-6 !text-sm disabled:opacity-50">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
