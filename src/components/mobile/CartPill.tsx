"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";

/** Floating "View cart" pill that sits just above the tab bar. */
export default function CartPill() {
  const { itemCount, subtotal, isHydrated, isDrawerOpen, openDrawer } = useCart();
  const shop = useShopStatus();
  if (!isHydrated || itemCount === 0 || isDrawerOpen || !shop.open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3">
      <button
        type="button"
        onClick={openDrawer}
        className="pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-between rounded-2xl bg-primary-text px-4 py-3 text-white shadow-hover transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent"><ShoppingBag size={16} /></span>
          <span className="font-semibold">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        </span>
        <span className="text-sm font-semibold">View cart · ₹{subtotal}</span>
      </button>
    </div>
  );
}
