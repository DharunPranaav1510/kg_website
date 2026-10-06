"use client";

import { usePathname } from "next/navigation";
import { Lock, Moon, ShoppingBag } from "lucide-react";
import { closedHeadline } from "@/components/ClosedNotice";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";

// Bottom dock on every public page: a "shop closed" notice (when an admin has
// paused orders) and the sticky "View cart" bar so phone shoppers never lose
// their cart.
export default function CartBar() {
  const { itemCount, subtotal, isDrawerOpen, openDrawer, isHydrated } = useCart();
  const shop = useShopStatus();
  const pathname = usePathname();

  if (isDrawerOpen || pathname.startsWith("/admin")) return null;
  const showCart = isHydrated && itemCount > 0;
  if (shop.open && !showCart) return null;

  return (
    <div className="kg-hide-on-phone pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
      {!shop.open && (
        <div
          role="status"
          className="pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl bg-primary-text px-4 py-3 text-sm text-white shadow-hover"
        >
          {shop.reason === "paused" ? <Lock size={16} className="mt-0.5 flex-shrink-0" /> : <Moon size={16} className="mt-0.5 flex-shrink-0" />}
          <p>
            <b>{closedHeadline(shop.reason)}</b> {shop.message}
          </p>
        </div>
      )}
      {showCart && (
        <button
          type="button"
          onClick={openDrawer}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-accent px-5 py-3.5 text-white shadow-hover transition-all hover:bg-accent-light active:scale-[0.98]"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag size={18} />
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className="text-sm font-semibold">View cart · ₹{subtotal}</span>
        </button>
      )}
    </div>
  );
}
