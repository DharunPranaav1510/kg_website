"use client";

import { useCallback, useEffect, useState } from "react";
import { shopCategories } from "@/data/products";

const categories = shopCategories.filter((c) => c !== "All");

interface AdminProduct {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  image: string;
  badge?: string;
  description: string;
  isEgg?: boolean;
  featured?: boolean;
  active: boolean;
}

type Draft = Omit<AdminProduct, "id" | "pricePerKg"> & {
  id?: string;
  pricePerKg: string;
};

const emptyDraft: Draft = {
  name: "",
  category: categories[0],
  pricePerKg: "",
  image: "",
  badge: "",
  description: "",
  isEgg: false,
  featured: false,
  active: true,
};

const inputCls =
  "mt-1 w-full rounded-xl border border-warm-gray px-3 py-2.5 text-sm outline-none focus:border-accent bg-white";

export default function AdminDashboard({ email }: { email: string }) {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Session expired mid-use: go through the refresh route (or login).
  const api = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (res.status === 401) {
      window.location.href = "/api/admin/refresh";
      throw new Error("Session expired");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
    return data;
  }, []);

  const load = useCallback(async () => {
    try {
      setProducts((await api("/api/admin/products")).products);
    } catch (e) {
      setMessage((e as Error).message);
      setProducts([]);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setMessage("");
    try {
      const body = JSON.stringify({ ...draft, pricePerKg: Number(draft.pricePerKg) });
      await api(draft.id ? `/api/admin/products/${draft.id}` : "/api/admin/products", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
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
      await api(`/api/admin/products/${p.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function seed() {
    setBusy(true);
    try {
      await api("/api/admin/products/seed", { method: "POST" });
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api("/api/admin/upload", { method: "POST", body: form });
      setDraft((d) => (d ? { ...d, image: url } : d));
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const edit = (p: AdminProduct) =>
    setDraft({ ...p, badge: p.badge ?? "", pricePerKg: String(p.pricePerKg) });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-primary-text">Products</h1>
          <p className="text-sm text-secondary-text">Signed in as {email}</p>
        </div>
        <div className="flex gap-2">
          <a href="/shop" className="btn-secondary !py-2 !px-4">View shop</a>
          <button onClick={() => { setMessage(""); setDraft({ ...emptyDraft }); }} className="btn-primary !py-2 !px-4">
            + Add product
          </button>
          <button onClick={logout} className="btn-secondary !py-2 !px-4">Log out</button>
        </div>
      </header>

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
          {products.map((p) => (
            <div key={p.id} className={`flex items-center gap-3 p-3 sm:p-4 ${p.active ? "" : "opacity-50"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-warm-gray flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-primary-text truncate">{p.name}</p>
                <p className="text-xs text-secondary-text">
                  {p.category} · ₹{p.pricePerKg}/{p.isEgg ? "dozen" : "kg"}
                  {p.featured ? " · Featured" : ""}
                  {p.active ? "" : " · Hidden"}
                </p>
              </div>
              <button onClick={() => edit(p)} className="text-sm font-medium text-accent hover:underline">Edit</button>
              <button onClick={() => remove(p)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-xl text-primary-text">
              {draft.id ? "Edit product" : "Add product"}
            </h2>

            <label className="block text-sm font-medium">
              Name
              <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Category
                <select className={inputCls} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Price (₹ per {draft.isEgg ? "dozen" : "kg / pack"})
                <input className={inputCls} type="number" min="0" step="1" inputMode="decimal" value={draft.pricePerKg} onChange={(e) => setDraft({ ...draft, pricePerKg: e.target.value })} />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Description
              <textarea className={inputCls} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>

            <label className="block text-sm font-medium">
              Badge (optional, e.g. New, Bestseller)
              <input className={inputCls} value={draft.badge ?? ""} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
            </label>

            <div className="text-sm font-medium">
              Photo
              <div className="mt-1 flex items-center gap-3">
                {draft.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-warm-gray" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                  className="text-sm"
                />
              </div>
              <p className="text-xs text-secondary-text mt-1">JPG, PNG or WebP, up to 4 MB.</p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!draft.isEgg} onChange={(e) => setDraft({ ...draft, isEgg: e.target.checked })} />
                Sold per dozen (eggs)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} />
                Show on home page
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                Visible in shop
              </label>
            </div>

            {message && <p className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{message}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setDraft(null); setMessage(""); }} className="btn-secondary !py-2 !px-5">Cancel</button>
              <button onClick={save} disabled={busy} className="btn-primary !py-2 !px-5 disabled:opacity-60">
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
