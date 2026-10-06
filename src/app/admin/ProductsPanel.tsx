"use client";

import { useCallback, useEffect, useState } from "react";
import { extrasToPayload, productToExtras } from "./ProductFormExtras";
import type { Product } from "@/data/products";
import ProductForm, { EMPTY_DRAFT, PRODUCT_CATEGORIES, type ProductDraft } from "./ProductForm";
import { adminApi } from "./api";

type AdminProduct = Product & { active: boolean };

export default function ProductsPanel() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setProducts((await adminApi("/api/admin/products")).products);
    } catch (e) {
      setMessage((e as Error).message);
      setProducts((p) => p ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(p: AdminProduct, body: Record<string, unknown>) {
    setMessage("");
    try {
      await adminApi(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setPriceEdits(({ [p.id]: _, ...rest }) => rest);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setMessage("");
    try {
      await adminApi(draft.id ? `/api/admin/products/${draft.id}` : "/api/admin/products", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, extras: undefined, ...extrasToPayload(draft.extras), pricePerKg: Number(draft.pricePerKg) }),
      });
      setDraft(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  async function remove(p: AdminProduct) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await adminApi(`/api/admin/products/${p.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function seed() {
    setBusy(true);
    try {
      await adminApi("/api/admin/products/seed", { method: "POST" });
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  async function upload(file: File) {
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await adminApi("/api/admin/upload", { method: "POST", body: form });
      setDraft((d) => (d ? { ...d, image: url } : d));
    } catch (e) {
      setMessage((e as Error).message);
    }
    setUploading(false);
  }

  const edit = (p: AdminProduct) =>
    setDraft({ ...p, badge: p.badge ?? "", pricePerKg: String(p.pricePerKg), inStock: p.inStock !== false, extras: productToExtras(p) });

  const shown = (products ?? []).filter(
    (p) =>
      (catFilter === "All" || p.category === catFilter) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="flex-1 min-w-[10rem] rounded-full border border-warm-gray bg-white px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-full border border-warm-gray bg-white px-4 py-2 text-sm"
        >
          {["All", ...PRODUCT_CATEGORIES].map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => { setMessage(""); setDraft({ ...EMPTY_DRAFT }); }} className="btn-primary !py-2 !px-4">
          + Add product
        </button>
      </div>

      {message && !draft && (
        <p className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{message}</p>
      )}

      {products === null ? (
        <p className="text-secondary-text">Loading…</p>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-gray p-8 text-center space-y-3">
          <p className="text-primary-text">No products in the database yet.</p>
          <p className="text-sm text-secondary-text">
            The shop is showing the built-in list. Import it to start editing prices.
          </p>
          <button onClick={seed} disabled={busy} className="btn-primary disabled:opacity-60">
            Import default products
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-gray divide-y divide-warm-gray">
          {shown.map((p) => {
            const editing = priceEdits[p.id] !== undefined;
            return (
              <div key={p.id} className={`flex flex-wrap items-center gap-3 p-3 sm:p-4 ${p.active ? "" : "opacity-50"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-warm-gray flex-shrink-0" />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium text-primary-text truncate">{p.name}</p>
                  <p className="text-xs text-secondary-text">
                    {p.category}
                    {p.featured ? " · Featured" : ""}
                    {p.active ? "" : " · Hidden"}
                  </p>
                  {(p.offer || p.schedule || p.gstRate != null || p.allowedWeights?.length) && (
                    <p className="mt-0.5 flex flex-wrap gap-1 text-[10px] font-medium">
                      {p.offer && <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">Offer ₹{p.offer.price}</span>}
                      {p.schedule && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Timed</span>}
                      {p.gstRate != null && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">GST {p.gstRate}%</span>}
                      {!!p.allowedWeights?.length && <span className="rounded-full bg-warm-gray px-2 py-0.5 text-secondary-text">{p.allowedWeights.length} quantities</span>}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-sm">
                  ₹
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={editing ? priceEdits[p.id] : p.pricePerKg}
                    onChange={(e) => setPriceEdits({ ...priceEdits, [p.id]: e.target.value })}
                    className="w-20 rounded-lg border border-warm-gray px-2 py-1.5 text-sm"
                    aria-label={`Price of ${p.name}`}
                  />
                  <span className="text-xs text-secondary-text">/{p.isEgg ? "dz" : "kg"}</span>
                  {editing && (
                    <button
                      onClick={() => patch(p, { pricePerKg: Number(priceEdits[p.id]) })}
                      className="ml-1 rounded-lg bg-success text-white text-xs px-2.5 py-1.5"
                    >
                      Save
                    </button>
                  )}
                </div>

                <button
                  onClick={() => patch(p, { inStock: p.inStock === false })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    p.inStock === false ? "bg-red-100 text-red-700" : "bg-success/10 text-success"
                  }`}
                  title="Tap to toggle"
                >
                  {p.inStock === false ? "Sold out" : "In stock"}
                </button>
                <button onClick={() => edit(p)} className="text-sm font-medium text-accent hover:underline">Edit</button>
                <button onClick={() => remove(p)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
              </div>
            );
          })}
          {shown.length === 0 && <p className="p-6 text-center text-sm text-secondary-text">No products match.</p>}
        </div>
      )}

      {draft && (
        <ProductForm
          draft={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={() => { setDraft(null); setMessage(""); }}
          onUpload={upload}
          saving={busy}
          uploading={uploading}
          error={message}
        />
      )}
    </section>
  );
}
