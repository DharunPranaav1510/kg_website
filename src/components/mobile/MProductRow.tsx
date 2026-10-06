"use client";

import Image from "next/image";
import { Clock, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import type { Product } from "@/data/products";
import { useProductPricing } from "@/components/useProductPricing";
import QtyControl from "./QtyControl";
import { qtyLabel, tap } from "./format";

/** One product per row: thumbnail, name and price, and the add / quantity control on the right. */
export default function MProductRow({ product }: { product: Product }) {
  const { addItem, getWeight } = useCart();
  const shop = useShopStatus();
  const open = shop.open;
  const pr = useProductPricing(product);
  const soldOut = product.inStock === false;
  const notNow = product.unavailableNote;
  const qty = getWeight(product.id);
  const inCart = qty > 0;
  const unit = product.isEgg ? "dozen" : "kg";

  return (
    <article className={`flex gap-3 rounded-2xl border bg-white p-2.5 shadow-soft ${inCart ? "border-success/40 ring-1 ring-success/25" : "border-warm-gray/70"}`}>
      <div className="relative h-[5.5rem] w-[5.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-warm-gray">
        <Image src={product.image} alt={product.name} fill sizes="88px" className={`object-cover ${soldOut || notNow ? "opacity-60 grayscale" : ""}`} />
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-white">Sold out</span>}
        {pr.onOffer && !soldOut && <span className="absolute left-0 top-0 rounded-br-lg bg-success px-1.5 py-0.5 text-[10px] font-bold text-white">{pr.off}% OFF</span>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-secondary-text">{product.category}</span>
          {product.badge && !soldOut && <span className="flex-shrink-0 rounded-full bg-accent/10 px-1.5 py-px text-[9px] font-semibold text-accent">{product.badge}</span>}
        </div>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] leading-tight text-primary-text">{product.name}</h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <p className="leading-tight">
            <span className="text-base font-bold text-primary-text">₹{pr.price}</span>
            {pr.onOffer && <span className="ml-1 text-xs text-secondary-text line-through">₹{pr.listPrice}</span>}
            <span className="text-[11px] text-secondary-text"> / {unit}</span>
            {inCart ? (
              <span className="block text-[11px] font-medium text-success">₹{pr.priceFor(qty)} for {qtyLabel(product, qty)}</span>
            ) : (
              (pr.gstNote || (pr.onOffer && pr.offerLabel)) && (
                <span className="block text-[10px] text-secondary-text">{[pr.onOffer ? pr.offerLabel : "", pr.gstNote].filter(Boolean).join(" · ")}</span>
              )
            )}
          </p>

          {soldOut ? (
            <span className="rounded-full bg-warm-gray px-3 py-2 text-xs font-medium text-secondary-text">Sold out</span>
          ) : notNow ? (
            <span className="flex max-w-[8.5rem] items-center gap-1 rounded-xl bg-warm-gray px-2.5 py-1.5 text-[11px] font-medium leading-tight text-secondary-text"><Clock size={12} className="flex-shrink-0" />{notNow}</span>
          ) : !open ? (
            <span className="max-w-[8.5rem] rounded-xl bg-warm-gray px-3 py-2 text-center text-[11px] font-medium leading-tight text-secondary-text">{shop.blockedLabel || "Paused"}</span>
          ) : inCart ? (
            <div className="flex-shrink-0"><QtyControl product={product} qty={qty} compact /></div>
          ) : (
            <button type="button" aria-label={`Add ${product.name}`} onClick={() => { tap(); addItem(product.id); }} className="flex h-10 flex-shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/5 px-4 text-sm font-semibold text-accent transition-transform active:scale-95 active:bg-accent/15">
              <Plus size={15} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
