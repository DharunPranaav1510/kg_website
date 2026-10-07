"use client";

import { useRef, useState } from "react";
import { Camera, Check, ChevronDown, Loader2 } from "lucide-react";
import { shopCategories } from "@/data/products";
import {
  EMPTY_EXTRAS,
  OfferFields,
  ScheduleFields,
  TaxFields,
  WeightsFields,
  offerSummary,
  scheduleSummary,
  taxSummary,
  weightsSummary,
  type ExtrasDraft,
} from "./ProductFormExtras";
import { SidePanel, clearDraft, clock, useDraftBackup, useUi } from "./ui";


export const PRODUCT_CATEGORIES = shopCategories.filter((c) => c !== "All");

export interface ProductDraft {
  id?: string;
  name: string;
  category: string;
  pricePerKg: string;
  image: string;
  badge?: string;
  description: string;
  isEgg?: boolean;
  featured?: boolean;
  inStock?: boolean;
  active: boolean;
  extras: ExtrasDraft;
}

export const EMPTY_DRAFT: ProductDraft = {
  name: "",
  category: PRODUCT_CATEGORIES[0],
  pricePerKg: "",
  image: "",
  badge: "",
  description: "",
  isEgg: false,
  featured: false,
  inStock: true,
  active: true,
  extras: EMPTY_EXTRAS,
};

export const draftKey = (d: ProductDraft) => `product:${d.id ?? "new"}`;
export const clearProductDraft = (d: ProductDraft) => clearDraft(draftKey(d));

const BADGES = ["New", "Bestseller", "Popular", "Premium"];
const field = "min-h-12 w-full rounded-xl border border-warm-gray bg-white px-3.5 text-base outline-none transition-colors focus:border-accent";

function Switch({ checked, onChange, title, hint }: { checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-cream/70">
      <span className="flex-1">
        <span className="block text-base font-medium">{title}</span>
        <span className="block text-sm text-secondary-text">{hint}</span>
      </span>
      <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-success" : "bg-gray-300"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Fold({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-warm-gray bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left">
        <span className="flex-1">
          <span className="block text-base font-semibold">{title}</span>
          {!open && <span className="block text-sm text-secondary-text">{summary}</span>}
        </span>
        <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-warm-gray px-4 py-4">{children}</div>}
    </section>
  );
}

export default function ProductForm({
  draft,
  onChange,
  onSave,
  onCancel,
  onUpload,
  saving,
  uploading,
  error,
}: {
  draft: ProductDraft;
  onChange: (d: ProductDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onUpload: (file: File) => void;
  saving: boolean;
  uploading: boolean;
  error: string;
}) {
  const { confirm } = useUi();
  const fileRef = useRef<HTMLInputElement>(null);
  const initial = useRef(draft);
  const [touched, setTouched] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => onChange({ ...draft, [k]: v });
  const isNew = !draft.id;
  const { found, dirty, dismiss, discard } = useDraftBackup<ProductDraft>(draftKey(draft), draft, initial.current);

  const price = Number(draft.pricePerKg);
  const problems = {
    image: !draft.image ? "Add a photo" : "",
    name: draft.name.trim().length < 2 ? "Enter the product name" : "",
    price: draft.pricePerKg === "" || !Number.isFinite(price) || price < 0 ? "Enter a price" : "",
  };
  const hasProblem = Object.values(problems).some(Boolean);
  const unit = draft.isEgg ? "dozen" : "kg";

  function submit() {
    setTouched(true);
    if (hasProblem) {
      // Scroll to the first field that needs attention.
      const first = (["image", "name", "price"] as const).find((k) => problems[k]);
      document.getElementById(`pf-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSave();
  }

  async function close() {
    if (dirty) {
      const r = await confirm({
        title: "Leave without saving?",
        body: "Your changes are kept as a draft on this device.",
        confirmLabel: "Leave",
        cancelLabel: "Keep editing",
      });
      if (r.choice !== "confirm") return;
    }
    onCancel();
  }

  const extrasProps = { value: draft.extras, onChange: (extras: ExtrasDraft) => set("extras", extras), isEgg: !!draft.isEgg, price: Number(draft.pricePerKg) || 0 };
  const err = (k: keyof typeof problems) => touched && problems[k] && <p className="mt-1.5 text-sm font-medium text-red-600">{problems[k]}</p>;

  return (
    <SidePanel
      open
      onClose={close}
      width="640px"
      title={isNew ? "Add a product" : "Edit product"}
      subtitle={isNew ? "It appears in the shop as soon as you save." : `${draft.name || "Untitled"} · ID ${draft.id}`}
      footer={
        <div className="flex items-center gap-3">
          <button onClick={close} className="min-h-12 rounded-full border border-warm-gray px-6 text-base font-medium hover:bg-cream">Cancel</button>
          <button onClick={submit} disabled={saving || uploading} className="btn-primary ml-auto min-h-12 !px-8 !text-base disabled:opacity-60">
            {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {found && (
          <p className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
            <span className="flex-1">You have an unsaved draft from {clock(new Date(found.at).toISOString())}.</span>
            <button onClick={() => { onChange(found.value); dismiss(); }} className="min-h-12 rounded-full bg-amber-600 px-4 font-semibold text-white">Restore</button>
            <button onClick={discard} className="min-h-12 rounded-full border border-amber-300 px-4 font-medium">Discard</button>
          </p>
        )}

        {/* 1. Basics */}
        <section className="space-y-4 rounded-2xl border border-warm-gray bg-white p-4">
          <h3 className="font-body text-base font-semibold">Basics</h3>

          <div id="pf-image">
            <p className="mb-1.5 text-sm font-medium">Photo <span className="font-normal text-secondary-text">· JPG, PNG or WebP, up to 4 MB</span></p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={`relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-cream transition-colors ${touched && problems.image ? "border-red-500" : "border-warm-gray hover:border-accent/50"}`}
            >
              {draft.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="Product preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-secondary-text">
                  <Camera size={28} />
                  <span className="text-base font-medium">Upload photo</span>
                </span>
              )}
              {draft.image && !uploading && (
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white"><Camera size={14} /> Change photo</span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-base font-medium"><Loader2 size={18} className="animate-spin" /> Uploading…</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
            <button type="button" onClick={() => setLinkMode((m) => !m)} className="mt-1 flex min-h-12 items-center text-base text-accent hover:underline">Use a link instead</button>
            {linkMode && <input className={field} value={draft.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" inputMode="url" aria-label="Image link" />}
            {err("image")}
          </div>

          <div id="pf-name">
            <label className="block text-sm font-medium">Name
              <input className={`${field} mt-1 ${touched && problems.name ? "!border-red-500" : ""}`} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Chicken Breast" maxLength={100} />
            </label>
            {err("name")}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Category
              <select className={`${field} mt-1`} value={draft.category} onChange={(e) => set("category", e.target.value)}>
                {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div id="pf-price">
              <label className="block text-sm font-medium">Price
                <span className={`mt-1 flex items-center overflow-hidden rounded-xl border bg-white focus-within:border-accent ${touched && problems.price ? "border-red-500" : "border-warm-gray"}`}>
                  <span className="pl-3.5 text-secondary-text">₹</span>
                  <input type="number" min="0" step="1" inputMode="decimal" value={draft.pricePerKg} onChange={(e) => set("pricePerKg", e.target.value)} className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-base outline-none" />
                  <span className="pr-3.5 text-sm text-secondary-text">per {unit}</span>
                </span>
              </label>
              {err("price")}
            </div>
          </div>

          <label className="block text-sm font-medium">Short description <span className="font-normal text-secondary-text">· {draft.description.length}/500</span>
            <textarea className={`${field} mt-1 resize-none py-3`} rows={2} maxLength={500} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="One line customers will read on the card" />
          </label>

          <div>
            <p className="mb-1.5 text-sm font-medium">Badge <span className="font-normal text-secondary-text">· optional</span></p>
            <div className="flex flex-wrap gap-2">
              {["", ...BADGES].map((b) => {
                const on = (draft.badge ?? "") === b;
                return (
                  <button key={b || "none"} type="button" onClick={() => set("badge", b)} aria-pressed={on} className={`inline-flex min-h-12 items-center gap-1.5 rounded-full border px-4 text-base font-medium transition-colors ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text hover:border-accent/40"}`}>
                    {on && <Check size={14} />}
                    {b || "None"}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. Availability */}
        <section className="rounded-2xl border border-warm-gray bg-white p-2">
          <h3 className="px-2 pb-1 pt-2 font-body text-base font-semibold">Availability</h3>
          <div className="divide-y divide-warm-gray/70">
            <Switch checked={draft.active} onChange={(v) => set("active", v)} title="Visible in shop" hint={draft.active ? "Customers can see this product." : "Hidden: customers cannot see it."} />
            <Switch checked={draft.inStock !== false} onChange={(v) => set("inStock", v)} title="In stock" hint={draft.inStock !== false ? "Customers can order it." : "Customers see “Sold out” and cannot order."} />
            <Switch checked={!!draft.featured} onChange={(v) => set("featured", v)} title="Featured on home page" hint={draft.featured ? "Shown in the home page list." : "Not shown on the home page."} />
            <Switch checked={!!draft.isEgg} onChange={(v) => set("isEgg", v)} title="Sold per dozen" hint={draft.isEgg ? "The price is per dozen." : "The price is per kg."} />
          </div>
        </section>

        {/* 3 to 6: folded, with a one-line summary */}
        <Fold title="Weights" summary={weightsSummary(draft.extras, !!draft.isEgg)}><WeightsFields {...extrasProps} /></Fold>
        <Fold title="Tax" summary={taxSummary(draft.extras)}><TaxFields {...extrasProps} /></Fold>
        <Fold title="Offer" summary={offerSummary(draft.extras)}><OfferFields {...extrasProps} /></Fold>
        <Fold title="Selling schedule" summary={scheduleSummary(draft.extras)}><ScheduleFields {...extrasProps} /></Fold>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}
      </div>
    </SidePanel>
  );
}
