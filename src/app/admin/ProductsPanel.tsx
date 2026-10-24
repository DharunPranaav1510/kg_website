"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Tags, X } from "lucide-react";
import { extrasToPayload, productToExtras } from "./ProductFormExtras";
import type { Product } from "@/data/products";
import ProductForm, { EMPTY_DRAFT, PRODUCT_CATEGORIES, clearProductDraft, type ProductDraft } from "./ProductForm";
import { adminApi } from "./api";
import { rupees, useUi } from "./ui";

type AdminProduct = Product & { active: boolean };
type Quick = "all" | "soldout" | "hidden" | "offer";

export default function ProductsPanel() {
  const { toast, confirm } = useUi();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [quick, setQuick] = useState<Quick>("all");
  const [cats, setCats] = useState<{ base: string[]; extra: string[] }>({ base: PRODUCT_CATEGORIES, extra: [] });
  const [catsOpen, setCatsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const allCats = [...cats.base, ...cats.extra];

  useEffect(() => {
    adminApi("/api/admin/categories").then(setCats).catch(() => {});
  }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.trim() || catBusy) return;
    setCatBusy(true);
    try {
      const r = await adminApi("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCat }) });
      setCats(r);
      toast({ text: `"${newCat.trim()}" added. It shows in the shop once it has a product.` });
      setNewCat("");
    } catch (err) {
      toast({ text: (err as Error).message, tone: "error" });
    }
    setCatBusy(false);
  }

  async function renameCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!renaming || catBusy) return;
    setCatBusy(true);
    try {
      setCats(await adminApi("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(renaming) }));
      if (catFilter === renaming.from) setCatFilter(renaming.to.trim());
      toast({ text: `Renamed to "${renaming.to.trim()}". Its products moved with it.` });
      setRenaming(null);
      load();
    } catch (err) {
      toast({ text: (err as Error).message, tone: "error" });
    }
    setCatBusy(false);
  }

  async function removeCategory(name: string) {
    const r = await confirm({ title: `Remove "${name}"?`, body: "Only an empty category can be removed.", confirmLabel: "Remove category", cancelLabel: "Keep it", danger: true });
    if (r.choice !== "confirm") return;
    try {
      setCats(await adminApi(`/api/admin/categories?name=${encodeURIComponent(name)}`, { method: "DELETE" }));
      if (catFilter === name) setCatFilter("All");
    } catch (err) {
      toast({ text: (err as Error).message, tone: "error" });
    }
  }

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

  /** A switch in a list acts at once and can be undone. */
  async function setStock(p: AdminProduct, inStock: boolean, withUndo = true) {
    setProducts((all) => all && all.map((x) => (x.id === p.id ? { ...x, inStock } : x)));
    try {
      await adminApi(`/api/admin/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inStock }) });
      if (withUndo) toast({ text: `${p.name} is now ${inStock ? "in stock" : "sold out"}.`, undo: () => setStock(p, !inStock, false) });
    } catch (e) {
      setProducts((all) => all && all.map((x) => (x.id === p.id ? { ...x, inStock: !inStock } : x)));
      toast({ text: `${p.name} was not changed. ${(e as Error).message}`, tone: "error", retry: () => setStock(p, inStock, withUndo) });
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
      clearProductDraft(draft);
      toast({ text: `${draft.name} saved. Live in the shop now.` });
      setDraft(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  async function remove(p: AdminProduct) {
    const r = await confirm({
      title: `Delete ${p.name}?`,
      body: "This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      danger: true,
      alternative: p.active ? { label: "Hide from shop instead", value: "hide" } : undefined,
    });
    if (r.choice === "hide") {
      try {
        await adminApi(`/api/admin/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, badge: p.badge ?? "", active: false, ...extrasToPayload(productToExtras(p)), pricePerKg: p.pricePerKg }) });
        toast({ text: `${p.name} is hidden from the shop.` });
        await load();
      } catch (e) {
        toast({ text: (e as Error).message, tone: "error" });
      }
      return;
    }
    if (r.choice !== "confirm") return;
    try {
      await adminApi(`/api/admin/products/${p.id}`, { method: "DELETE" });
      toast({ text: `${p.name} deleted.` });
      await load();
    } catch (e) {
      toast({ text: `Could not delete ${p.name}. ${(e as Error).message}`, tone: "error" });
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
      p.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (quick === "all" || (quick === "soldout" && p.inStock === false) || (quick === "hidden" && !p.active) || (quick === "offer" && !!p.offer))
  );

  const chip = (on: boolean) =>
    `min-h-12 whitespace-nowrap rounded-full border px-4 text-base font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text hover:text-primary-text"}`;
  const tags = (p: AdminProduct) => (
    <span className="flex flex-wrap gap-1 text-sm font-medium">
      {!p.active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">Hidden</span>}
      {p.featured && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">Featured</span>}
      {p.offer && <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">Offer running</span>}
      {p.schedule && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Scheduled</span>}
      {p.packKg && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-800">{p.packKg} kg packs</span>}
    </span>
  );
  const stockSwitch = (p: AdminProduct) => {
    const on = p.inStock !== false;
    return (
      <button role="switch" aria-checked={on} aria-label={`${p.name}: ${on ? "In stock" : "Sold out"}`} onClick={() => setStock(p, !on)} className="flex min-h-12 items-center gap-2 rounded-full px-1">
        <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-red-400"}`} aria-hidden="true">
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
        </span>
        <span className={`w-20 text-left text-base font-medium ${on ? "text-success" : "text-red-600"}`}>{on ? "In stock" : "Sold out"}</span>
      </button>
    );
  };
  const unit = (p: AdminProduct) => (p.isEgg ? "dozen" : "kg");

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-2xl sm:text-3xl">Products</h1>
        <button onClick={() => setCatsOpen((o) => !o)} aria-expanded={catsOpen} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-warm-gray bg-white px-5 text-base font-medium hover:bg-cream">
          <Tags size={18} /> Categories
        </button>
        <button onClick={() => { setMessage(""); setDraft({ ...EMPTY_DRAFT }); }} className="btn-primary hidden min-h-12 !text-base lg:inline-flex">
          <Plus size={18} /> Add product
        </button>
      </div>

      {catsOpen && (
        <div className="mb-4 rounded-2xl border border-warm-gray bg-white p-4">
          <p className="mb-2 text-base font-semibold">Categories</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {cats.base.map((c) => <span key={c} className="rounded-full bg-cream px-3 py-1.5 text-sm">{c}</span>)}
            {cats.extra.map((c) => renaming?.from === c ? (
              <form key={c} onSubmit={renameCategory} className="flex items-center gap-1">
                <input autoFocus value={renaming.to} onChange={(e) => setRenaming({ from: c, to: e.target.value })} maxLength={40} aria-label={`New name for ${c}`} className="min-h-10 w-44 rounded-full border border-accent px-3 text-sm outline-none" />
                <button type="submit" disabled={catBusy || renaming.to.trim().length < 2} className="min-h-10 rounded-full bg-accent px-3 text-sm font-medium text-white disabled:opacity-60">Save</button>
                <button type="button" onClick={() => setRenaming(null)} className="min-h-10 px-2 text-sm text-secondary-text">Cancel</button>
              </form>
            ) : (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-accent/10 py-1.5 pl-3 pr-1.5 text-sm text-accent">
                {c}
                <button onClick={() => setRenaming({ from: c, to: c })} aria-label={`Rename ${c}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent/20"><Pencil size={13} /></button>
                <button onClick={() => removeCategory(c)} aria-label={`Remove ${c}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent/20"><X size={14} /></button>
              </span>
            ))}
          </div>
          <form onSubmit={addCategory} className="flex flex-wrap gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={40} placeholder="New category, e.g. Spices" aria-label="New category name" className="min-h-12 min-w-[12rem] flex-1 rounded-full border border-warm-gray px-4 text-base outline-none focus:border-accent" />
            <button type="submit" disabled={catBusy || newCat.trim().length < 2} className="btn-primary min-h-12 !text-base disabled:opacity-60">{catBusy ? "Adding…" : "Add category"}</button>
          </form>
          <p className="mt-2 text-sm text-secondary-text">A new category appears in the shop once it has a product. GST for its products uses each product's own rate.</p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" className="min-h-12 min-w-[12rem] flex-1 rounded-full border border-warm-gray bg-white px-4 text-base outline-none focus:border-accent" />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Category" className="min-h-12 rounded-full border border-warm-gray bg-white px-4 text-base">
          {["All", ...allCats].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto" role="group" aria-label="Quick filters">
        {([["all", "All"], ["soldout", "Sold out"], ["hidden", "Hidden"], ["offer", "On offer"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setQuick(id)} aria-pressed={quick === id} className={chip(quick === id)}>{label}</button>
        ))}
      </div>

      {message && !draft && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{message}</p>}

      {products === null ? (
        <p className="text-base text-secondary-text">Loading…</p>
      ) : products.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-warm-gray bg-white p-8 text-center">
          <p className="text-lg">No products yet.</p>
          <p className="text-base text-secondary-text">The shop is showing the built-in list. Import it to start editing, or add your own.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={seed} disabled={busy} className="min-h-12 rounded-full border border-warm-gray px-6 text-base font-medium hover:bg-cream disabled:opacity-60">Import default products</button>
            <button onClick={() => setDraft({ ...EMPTY_DRAFT })} className="btn-primary min-h-12 !text-base">Add product</button>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-warm-gray bg-white p-8 text-center text-base text-secondary-text">No products match.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-warm-gray bg-white md:block">
            <table className="w-full text-left text-base">
              <thead className="bg-cream text-sm text-secondary-text">
                <tr>{["", "Name", "Category", "Price", "Stock", "Tags", ""].map((h, i) => <th key={i} scope="col" className="px-3 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-warm-gray/70">
                {shown.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "bg-gray-50 text-secondary-text"}>
                    <td className="w-16 px-3 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" className="h-12 w-12 rounded-xl bg-warm-gray object-cover" />
                    </td>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-secondary-text">{p.category}</td>
                    <td className="px-3 py-2 tabular-nums">{rupees(p.pricePerKg)} / {unit(p)}</td>
                    <td className="px-3 py-1">{stockSwitch(p)}</td>
                    <td className="px-3 py-2">{tags(p)}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center justify-end gap-2">
                        <button onClick={() => edit(p)} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Edit</button>
                        <button onClick={() => remove(p)} className="min-h-12 rounded-full border border-red-200 px-5 text-base font-medium text-red-600 hover:bg-red-50">Delete</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone cards */}
          <ul className="space-y-2 pb-16 md:hidden">
            {shown.map((p) => (
              <li key={p.id} className={`rounded-2xl border border-warm-gray bg-white p-3 ${p.active ? "" : "opacity-70"}`}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl bg-warm-gray object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{p.name}</p>
                    <p className="text-base tabular-nums text-secondary-text">{rupees(p.pricePerKg)} / {unit(p)}</p>
                    {tags(p)}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {stockSwitch(p)}
                  <span className="ml-auto flex items-center gap-2">
                    <button onClick={() => edit(p)} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Edit</button>
                    <button onClick={() => remove(p)} className="min-h-12 rounded-full border border-red-200 px-5 text-base font-medium text-red-600 hover:bg-red-50">Delete</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Phones: a round add button above the bottom bar */}
      <button onClick={() => { setMessage(""); setDraft({ ...EMPTY_DRAFT }); }} aria-label="Add product" className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-hover lg:hidden">
        <Plus size={26} />
      </button>

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
          categories={allCats}
        />
      )}
    </section>
  );
}
