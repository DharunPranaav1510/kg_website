"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import type { Product } from "@/data/products";
import { defaultQty, maxFor, qtyLabel, stepFor, tap } from "./format";

/** One product per row: thumbnail, name and price, and the add / quantity control on the right. */
export default function MProductRow({ product }: { product: Product }) {
  const { addItem, updateWeight, getWeight } = useCart();
  const open = useShopStatus().open;
  const soldOut = product.inStock === false;
  const qty = getWeight(product.id);
  const inCart = qty > 0;
  const step = stepFor(product);
  const unit = product.isEgg ? "dozen" : "kg";
  const dq = defaultQty(product);

  return (
    <article className={`flex gap-3 rounded-2xl border bg-white p-2.5 shadow-soft ${inCart ? "border-success/40 ring-1 ring-success/25" : "border-warm-gray/70"}`}>
      <div className="relative h-[5.5rem] w-[5.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-warm-gray">
        <Image src={product.image} alt={product.name} fill sizes="88px" className={`object-cover ${soldOut ? "opacity-60 grayscale" : ""}`} />
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-white">Sold out</span>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-secondary-text">{product.category}</span>
          {product.badge && !soldOut && <span className="flex-shrink-0 rounded-full bg-accent/10 px-1.5 py-px text-[9px] font-semibold text-accent">{product.badge}</span>}
        </div>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] leading-tight text-primary-text">{product.name}</h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <p className="leading-tight">
            <span className="text-base font-bold text-primary-text">₹{product.pricePerKg}</span>
            <span className="text-[11px] text-secondary-text"> / {unit}</span>
            {inCart && <span className="block text-[11px] font-medium text-success">₹{Math.round(product.pricePerKg * qty)} for {qtyLabel(product, qty)}</span>}
          </p>

          {soldOut ? (
            <span className="rounded-full bg-warm-gray px-3 py-2 text-xs font-medium text-secondary-text">Sold out</span>
          ) : !open ? (
            <span className="rounded-full bg-warm-gray px-3 py-2 text-xs font-medium text-secondary-text">Paused</span>
          ) : inCart ? (
            <div className="flex h-10 flex-shrink-0 items-center rounded-full bg-accent text-white">
              <button type="button" aria-label={`Less ${product.name}`} onClick={() => { tap(); updateWeight(product.id, qty - step); }} className="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/20">
                <Minus size={16} />
              </button>
              <span className="min-w-[2.4rem] text-center text-sm font-semibold">{qtyLabel(product, qty)}</span>
              <button type="button" aria-label={`More ${product.name}`} disabled={qty >= maxFor(product)} onClick={() => { tap(); updateWeight(product.id, Math.min(maxFor(product), qty + step)); }} className="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40">
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button type="button" aria-label={`Add ${product.name}`} onClick={() => { tap(); addItem(product.id, dq); }} className="flex h-10 flex-shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/5 px-4 text-sm font-semibold text-accent transition-transform active:scale-95 active:bg-accent/15">
              <Plus size={15} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
