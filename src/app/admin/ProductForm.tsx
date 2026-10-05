"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, X } from "lucide-react";
import { shopCategories } from "@/data/products";

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
};

const BADGES = ["New", "Bestseller", "Popular", "Premium"];
const field =
  "w-full rounded-xl border border-warm-gray bg-white px-3.5 py-3 text-base outline-none transition-colors focus:border-accent sm:text-sm";

function Switch({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-cream/70"
    >
      <span className="flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-secondary-text">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-success" : "bg-warm-gray"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium">{children}</span>
      {hint && <span className="text-xs text-secondary-text">{hint}</span>}
    </div>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => onChange({ ...draft, [k]: v });
  const isNew = !draft.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  const price = Number(draft.pricePerKg);
  const problems = {
    name: draft.name.trim().length < 2 ? "Enter the product name" : "",
    price: draft.pricePerKg === "" || !Number.isFinite(price) || price < 0 ? "Enter a price" : "",
    image: !draft.image ? "Add a photo" : "",
  };
  const hasProblem = Object.values(problems).some(Boolean);
  const unit = draft.isEgg ? "dozen" : "kg";

  function submit() {
    setTouched(true);
    if (!hasProblem) onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={isNew ? "Add product" : "Edit product"}>
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-background shadow-hover sm:max-w-xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-warm-gray bg-white px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl">{isNew ? "Add a product" : "Edit product"}</h2>
            <p className="truncate text-xs text-secondary-text">
              {isNew ? "It appears in the shop as soon as you save." : (
                <>
                  {draft.name || "Untitled"} · ID <code className="rounded bg-warm-gray/60 px-1.5 py-0.5 text-[11px]">{draft.id}</code>
                </>
              )}
            </p>
          </div>
          <button onClick={onCancel} aria-label="Close" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Photo */}
          <section>
            <Label hint="JPG, PNG or WebP · up to 4 MB">Photo</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={`group relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white transition-colors sm:h-48 ${
                touched && problems.image ? "border-accent" : "border-warm-gray hover:border-accent/50"
              }`}
            >
              {draft.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-secondary-text">
                  <Camera size={28} />
                  <span className="text-sm font-medium">Tap to add a photo</span>
                </span>
              )}
              {draft.image && !uploading && (
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-2 text-xs font-medium text-white">
                  <Camera size={14} /> Change photo
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-sm font-medium">
                  <Loader2 size={18} className="animate-spin" /> Uploading…
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            {touched && problems.image && <p className="mt-1.5 text-xs text-accent">{problems.image}</p>}
          </section>

          {/* Basics */}
          <section className="space-y-4">
            <div>
              <Label>Name</Label>
              <input className={`${field} ${touched && problems.name ? "border-accent" : ""}`} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Chicken Breast" maxLength={100} />
              {touched && problems.name && <p className="mt-1.5 text-xs text-accent">{problems.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <select className={field} value={draft.category} onChange={(e) => set("category", e.target.value)}>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Price</Label>
                <div className={`flex items-center overflow-hidden rounded-xl border bg-white focus-within:border-accent ${touched && problems.price ? "border-accent" : "border-warm-gray"}`}>
                  <span className="pl-3.5 text-secondary-text">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    value={draft.pricePerKg}
                    onChange={(e) => set("pricePerKg", e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base outline-none sm:text-sm"
                    aria-label="Price in rupees"
                  />
                  <span className="pr-3.5 text-xs text-secondary-text">/ {unit}</span>
                </div>
                {touched && problems.price && <p className="mt-1.5 text-xs text-accent">{problems.price}</p>}
              </div>
            </div>

            <div>
              <Label hint={`${draft.description.length}/500`}>Short description</Label>
              <textarea className={`${field} resize-none`} rows={2} maxLength={500} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="One line customers will read on the card" />
            </div>

            <div>
              <Label hint="optional">Badge</Label>
              <div className="flex flex-wrap gap-2">
                {["", ...BADGES].map((b) => {
                  const on = (draft.badge ?? "") === b;
                  return (
                    <button key={b || "none"} type="button" onClick={() => set("badge", b)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text hover:border-accent/40"}`}>
                      {on && <Check size={12} />}
                      {b || "None"}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Switches */}
          <section>
            <Label>Availability</Label>
            <div className="divide-y divide-warm-gray/70 rounded-2xl border border-warm-gray bg-white p-1">
              <Switch checked={draft.active} onChange={(v) => set("active", v)} title="Visible in the shop" hint="Turn off to hide it without deleting." />
              <Switch checked={draft.inStock !== false} onChange={(v) => set("inStock", v)} title="In stock today" hint="Off shows “Sold out” and blocks orders." />
              <Switch checked={!!draft.featured} onChange={(v) => set("featured", v)} title="Show on the home page" hint="Featured products appear in the home page list." />
              <Switch checked={!!draft.isEgg} onChange={(v) => set("isEgg", v)} title="Sold per dozen" hint="For eggs: the price is per dozen, not per kg." />
            </div>
          </section>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-warm-gray bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button onClick={onCancel} className="btn-secondary !px-6 !py-2.5">Cancel</button>
          <button onClick={submit} disabled={saving || uploading} className="btn-primary ml-auto !px-8 !py-2.5 disabled:opacity-60">
            {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
