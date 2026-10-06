"use client";

import Image from "next/image";
import { Check, Clock, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import type { Product } from "@/data/products";
import { useProductPricing } from "@/components/useProductPricing";
import QtyControl from "./QtyControl";
import { qtyLabel, tap } from "./format";

export default function MProductCard({ product, className = "" }: { product: Product; className?: string }) {
  const { addItem, getWeight } = useCart();
  const open = useShopStatus().open;
  const pr = useProductPricing(product);
  const soldOut = product.inStock === false;
  const notNow = product.unavailableNote;
  const qty = getWeight(product.id);
  const inCart = qty > 0;

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-soft transition-shadow ${inCart ? "border-success/40 ring-1 ring-success/25" : "border-warm-gray/70"} ${className}`}>
      <div className="relative aspect-[3/2] bg-warm-gray">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 480px) 50vw, 240px" className={`object-cover ${soldOut || notNow ? "opacity-60 grayscale" : ""}`} />
        {pr.onOffer && !soldOut ? (
          <span className="absolute left-2 top-2 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white shadow-soft">{pr.off}% OFF</span>
        ) : (
          product.badge && !soldOut && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-accent shadow-soft">{product.badge}</span>
        )}
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white">Sold out</span>}
        {inCart && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success shadow-soft"><Check size={13} className="text-white" strokeWidth={3} /></span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-secondary-text">{product.category}</p>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] leading-tight text-primary-text">{product.name}</h3>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-1 pt-2">
          <span className="text-base font-bold text-primary-text">₹{pr.price}</span>
          {pr.onOffer && <span className="text-xs text-secondary-text line-through">₹{pr.listPrice}</span>}
          <span className="text-[11px] text-secondary-text">/ {product.isEgg ? "dozen" : "kg"}</span>
        </p>
        {pr.gstNote && <p className="text-[10px] text-secondary-text">{pr.gstNote}</p>}

        <div className="mt-3">
          {soldOut ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-xs font-medium text-secondary-text">Sold out today</p>
          ) : notNow ? (
            <p className="flex items-center justify-center gap-1 rounded-xl bg-warm-gray px-2 py-2 text-center text-[11px] font-medium leading-tight text-secondary-text"><Clock size={12} className="flex-shrink-0" />{notNow}</p>
          ) : !open ? (
            <p className="rounded-full bg-warm-gray py-2.5 text-center text-xs font-medium text-secondary-text">Orders paused</p>
          ) : inCart ? (
            <QtyControl product={product} qty={qty} />
          ) : (
            <button type="button" onClick={() => { tap(); addItem(product.id); }} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/5 text-sm font-semibold text-accent transition-transform active:scale-95 active:bg-accent/15">
              <Plus size={16} /> Add {qtyLabel(product, pr.first)}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
