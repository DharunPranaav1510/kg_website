"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, PencilLine } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import type { Product } from "@/data/products";
import { useProductPricing } from "@/components/useProductPricing";
import { fraction } from "@/components/mobile/format";

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

const fmtQty = (product: Product, w: number) => `${fraction(w)} ${product.isEgg ? "dozen" : "kg"}`;
const shortQty = (product: Product, w: number) => `${fraction(w)} ${product.isEgg ? "dz" : "kg"}`;

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, updateWeight, getWeight } = useCart();
  const shop = useShopStatus();
  const shopOpen = shop.open;
  const [picking, setPicking] = useState(false);
  const pr = useProductPricing(product);
  const [draftWeight, setDraftWeight] = useState(pr.first);

  const soldOut = product.inStock === false;
  const notNow = product.unavailableNote;
  const quickOptions = pr.quick.map((value) => ({ label: shortQty(product, value), value }));

  const cartWeight = getWeight(product.id);
  const inCart = cartWeight > 0;
  const priceFor = pr.priceFor;

  const openPicker = () => {
    setDraftWeight(inCart ? cartWeight : pr.quick[0] ?? pr.first);
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
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-lg font-bold text-primary-text">₹{pr.price}</span>
            {pr.onOffer && <span className="text-sm text-secondary-text line-through">₹{pr.listPrice}</span>}
            <span className="text-xs text-secondary-text">/ {product.isEgg ? "dozen" : "kg"}</span>
            {pr.onOffer && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">{pr.off}% off</span>}
            </p>
          {(pr.gstNote || (pr.onOffer && pr.offerLabel)) && (
            <p className="mt-0.5 text-[11px] text-secondary-text">
              {pr.onOffer && pr.offerLabel && <b className="text-success">{pr.offerLabel}</b>}
              {pr.onOffer && pr.offerLabel && pr.gstNote && " · "}
              {pr.gstNote}
            </p>
          )}
        </div>
      </div>

      {picking && (
        <div className="mt-3.5 rounded-2xl border border-warm-gray bg-cream p-3">
          <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label={`Quantity of ${product.name}`}>
            {pr.allowed.map((w) => (
              <button key={w} type="button" role="radio" aria-checked={draftWeight === w} onClick={() => setDraftWeight(w)}
                className={`min-h-11 min-w-[4.25rem] flex-1 rounded-full border px-3 text-sm font-semibold transition-all ${
                  draftWeight === w ? "border-accent bg-accent text-white" : "border-warm-gray bg-white text-primary-text"
                }`}>
                {shortQty(product, w)}
              </button>
            ))}
          </div>
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
          ) : notNow ? (
            <p className="rounded-full bg-warm-gray px-3 py-2.5 text-center text-sm font-medium text-secondary-text">{notNow}</p>
          ) : !shopOpen ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-sm font-medium text-secondary-text">{shop.blockedLabel || "Orders paused"}</p>
          ) : soldOut ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-sm font-medium text-secondary-text">Sold out today</p>
          ) : (
            <div className={`grid gap-2 ${quickOptions.length >= 3 ? "grid-cols-4" : quickOptions.length === 2 ? "grid-cols-3" : "grid-cols-2"}`} role="group" aria-label={`Quick add ${product.name}`}>
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
