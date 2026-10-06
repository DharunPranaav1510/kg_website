"use client";

import Image from "next/image";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import type { Product } from "@/data/products";
import { defaultQty, maxFor, qtyLabel, stepFor, tap } from "./format";

export default function MProductCard({ product, className = "" }: { product: Product; className?: string }) {
  const { addItem, updateWeight, getWeight } = useCart();
  const open = useShopStatus().open;
  const soldOut = product.inStock === false;
  const qty = getWeight(product.id);
  const inCart = qty > 0;
  const step = stepFor(product);
  const price = Math.round(product.pricePerKg * (inCart ? qty : defaultQty(product)));

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-soft transition-shadow ${inCart ? "border-success/40 ring-1 ring-success/25" : "border-warm-gray/70"} ${className}`}>
      <div className="relative aspect-[4/3] bg-warm-gray">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 480px) 50vw, 240px" className={`object-cover ${soldOut ? "opacity-60 grayscale" : ""}`} />
        {product.badge && !soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-accent shadow-soft">{product.badge}</span>
        )}
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white">Sold out</span>}
        {inCart && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success shadow-soft"><Check size={13} className="text-white" strokeWidth={3} /></span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-secondary-text">{product.category}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] font-display text-[15px] leading-tight text-primary-text">{product.name}</h3>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-base font-bold text-primary-text">₹{product.pricePerKg}</span>
          <span className="text-[11px] text-secondary-text">/ {product.isEgg ? "dozen" : "kg"}</span>
        </p>

        <div className="mt-3">
          {soldOut ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-xs font-medium text-secondary-text">Sold out today</p>
          ) : !open ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-xs font-medium text-secondary-text">Orders paused</p>
          ) : inCart ? (
            <div className="flex h-11 items-center justify-between rounded-full bg-accent px-1 text-white">
              <button type="button" aria-label={`Less ${product.name}`} onClick={() => { tap(); updateWeight(product.id, qty - step); }} className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/20">
                <Minus size={16} />
              </button>
              <span className="text-center leading-tight">
                <span className="block text-sm font-semibold">{qtyLabel(product, qty)}</span>
                <span className="block text-[10px] opacity-90">₹{price}</span>
              </span>
              <button type="button" aria-label={`More ${product.name}`} disabled={qty >= maxFor(product)} onClick={() => { tap(); updateWeight(product.id, Math.min(maxFor(product), qty + step)); }} className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40">
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => { tap(); addItem(product.id, defaultQty(product)); }} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/5 text-sm font-semibold text-accent transition-transform active:scale-95 active:bg-accent/15">
              <Plus size={16} /> Add · {qtyLabel(product, defaultQty(product))}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
