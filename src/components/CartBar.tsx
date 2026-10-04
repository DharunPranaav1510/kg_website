"use client";

import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Sticky "View cart" bar so shoppers on phones never lose the cart.
export default function CartBar() {
  const { itemCount, subtotal, isDrawerOpen, openDrawer, isHydrated } = useCart();
  const pathname = usePathname();

  if (!isHydrated || itemCount === 0 || isDrawerOpen || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 pr-3 pointer-events-none">
      <button
        type="button"
        onClick={openDrawer}
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-accent text-white px-5 py-3.5 shadow-hover hover:bg-accent-light active:scale-[0.98] transition-all animate-fade-up"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingBag size={18} />
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="text-sm font-semibold">View cart · ₹{subtotal}</span>
      </button>
    </div>
  );
}
