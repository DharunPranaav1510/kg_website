"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, PencilLine } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import type { Product } from "@/data/products";

const badgeColors: Record<string, string> = {
  Bestseller: "bg-amber-100 text-amber-800",
  New:        "bg-success/10 text-success",
  Popular:    "bg-accent/10 text-accent",
  Premium:    "bg-accent/10 text-accent",
};

const categoryBorder: Record<string, string> = {
  Chicken:           "border-t-[3px] border-t-orange-400",
  Mutton:            "border-t-[3px] border-t-amber-800",
  Eggs:              "border-t-[3px] border-t-yellow-400",
  "Frozen Products": "border-t-[3px] border-t-sky-400",
  "Ready To Cook":   "border-t-[3px] border-t-accent",
};

const EGG_OPTIONS = [
  { label: "½ Dozen", value: 0.5 },
  { label: "1 Dozen", value: 1 },
  { label: "2 Dozen", value: 2 },
];

const fmtQty = (product: Product, w: number) =>
  product.isEgg ? `${w === 0.5 ? "½" : w} dozen` : `${w} kg`;

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, updateWeight, getWeight } = useCart();
  const shopOpen = useShopStatus().open;
  const [picking, setPicking] = useState(false);
  const [draftWeight, setDraftWeight] = useState(0.5);

  const soldOut = product.inStock === false;
  const quickOptions = product.isEgg
    ? [{ label: "1 dz", value: 1 }, { label: "2 dz", value: 2 }]
    : [{ label: "½ kg", value: 0.5 }, { label: "1 kg", value: 1 }, { label: "2 kg", value: 2 }];

  const cartWeight = getWeight(product.id);
  const inCart = cartWeight > 0;
  const priceFor = (w: number) => Math.round(product.pricePerKg * w);

  const openPicker = () => {
    setDraftWeight(inCart ? cartWeight : product.isEgg ? 1 : 0.5);
    setPicking(true);
  };

  const confirmAdd = () => {
    if (inCart) updateWeight(product.id, draftWeight);
    else addItem(product.id, draftWeight);
    setPicking(false);
  };

  return (
    <div
      className={`card-base group flex flex-col p-3.5 transition-all duration-300 sm:p-5 ${categoryBorder[product.category] ?? ""} ${
        inCart ? "ring-2 ring-success/35 shadow-glow" : ""
      }`}
    >
      <div className="flex gap-3.5">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-warm-gray shadow-soft sm:h-28 sm:w-28">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "opacity-60 grayscale" : ""}`}
            sizes="112px"
          />
          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white">
              Sold out
            </span>
          )}
          {inCart && (
            <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-success shadow-soft">
              <Check size={13} className="text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-secondary-text">{product.category}</span>
            {product.badge && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeColors[product.badge] ?? "bg-white/90 text-primary-text"}`}>
                {product.badge}
              </span>
            )}
          </div>
          <h3 className="font-display text-base leading-tight text-primary-text sm:text-lg">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-secondary-text">{product.description}</p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-primary-text">₹{product.pricePerKg}</span>
            <span className="text-xs text-secondary-text">/ {product.isEgg ? "dozen" : "kg"}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />Fresh daily
            </span>
          </p>
        </div>
      </div>

      {picking && (
        <div className="mt-3.5 rounded-2xl border border-warm-gray bg-cream p-3">
          {product.isEgg ? (
            <div className="mb-3 flex gap-2">
              {EGG_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setDraftWeight(opt.value)}
                  className={`min-h-11 flex-1 rounded-full border text-sm font-semibold transition-all ${
                    draftWeight === opt.value ? "border-accent bg-accent text-white" : "border-warm-gray bg-white text-primary-text"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-secondary-text">Weight</span>
                <span className="font-semibold text-primary-text">{draftWeight} kg</span>
              </div>
              <input type="range" min={0.25} max={3} step={0.25} value={draftWeight}
                onChange={(e) => setDraftWeight(Number(e.target.value))}
                aria-label={`Weight of ${product.name} in kilograms`}
                className="mb-1 h-11 w-full accent-accent" />
              <div className="flex justify-between text-xs text-secondary-text"><span>0.25 kg</span><span>3 kg</span></div>
            </>
          )}
          <div className="my-3 text-center text-2xl font-bold text-primary-text">₹{priceFor(draftWeight)}</div>
          <div className="flex gap-2">
            <button type="button" onClick={confirmAdd}
              className="min-h-11 flex-1 rounded-full bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-light active:scale-95">
              {inCart ? "Update" : "Add to cart"}
            </button>
            <button type="button" onClick={() => setPicking(false)}
              className="min-h-11 rounded-full border border-warm-gray px-5 text-sm text-secondary-text transition-colors hover:border-accent/40">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!picking && (
        <div className="mt-3.5">
          {inCart ? (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium text-success"><Check size={15} />In cart</p>
                <p className="truncate text-xs text-secondary-text">{fmtQty(product, cartWeight)} · <b className="text-primary-text">₹{priceFor(cartWeight)}</b></p>
              </div>
              <button type="button" onClick={openPicker}
                className="min-h-10 rounded-full border border-warm-gray px-4 text-sm font-medium text-primary-text transition-colors hover:border-accent/40">
                Edit
              </button>
              <button type="button" onClick={() => updateWeight(product.id, 0)}
                className="min-h-10 rounded-full border border-warm-gray px-4 text-sm text-secondary-text transition-colors hover:border-accent/40 hover:text-accent">
                Remove
              </button>
            </div>
          ) : !shopOpen ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-sm font-medium text-secondary-text">Orders paused</p>
          ) : soldOut ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-sm font-medium text-secondary-text">Sold out today</p>
          ) : (
            <div className={`grid gap-2 ${quickOptions.length === 3 ? "grid-cols-4" : "grid-cols-3"}`} role="group" aria-label={`Quick add ${product.name}`}>
              {quickOptions.map((opt) => (
                <button key={opt.value} type="button" onClick={() => addItem(product.id, opt.value)}
                  className="flex min-h-12 flex-col items-center justify-center rounded-xl border border-warm-gray bg-white py-1.5 text-center transition-all hover:border-accent hover:bg-accent/5 active:scale-95">
                  <span className="text-sm font-semibold leading-tight text-primary-text">{opt.label}</span>
                  <span className="text-[11px] leading-tight text-secondary-text">₹{priceFor(opt.value)}</span>
                </button>
              ))}
              <button type="button" onClick={openPicker}
                className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-light active:scale-95"
                aria-label={`Choose another quantity of ${product.name}`}>
                <PencilLine size={15} strokeWidth={1.9} />
                <span className="text-[11px] font-semibold leading-tight">Other</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
