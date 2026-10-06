"use client";

import { Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { stepWeight } from "@/lib/pricing";
import { qtyLabel, tap } from "./format";

/** The red "- 1 kg +" pill. Steps through the quantities the shop allows for this product. */
export default function QtyControl({ product, qty, compact = false }: { product: Product; qty: number; compact?: boolean }) {
  const { updateWeight } = useCart();
  const less = stepWeight(product, qty, -1);
  const more = stepWeight(product, qty, 1);
  const btn = `flex items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40 ${compact ? "h-10 w-10" : "h-9 w-9"}`;
  return (
    <div className={`flex items-center justify-between rounded-full bg-accent text-white ${compact ? "h-10" : "h-11 px-1"}`}>
      <button type="button" aria-label={`Less ${product.name}`} onClick={() => { tap(); updateWeight(product.id, less ?? 0); }} className={btn}>
        <Minus size={16} />
      </button>
      <span className="min-w-[2.4rem] text-center text-sm font-semibold">{qtyLabel(product, qty)}</span>
      <button type="button" aria-label={`More ${product.name}`} disabled={more === null} onClick={() => { tap(); if (more !== null) updateWeight(product.id, more); }} className={btn}>
        <Plus size={16} />
      </button>
    </div>
  );
}
