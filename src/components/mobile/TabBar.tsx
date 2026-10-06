"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, LayoutGrid, Menu, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { tap } from "./format";

const tabs = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/shop", label: "Shop", icon: LayoutGrid, match: (p: string) => p.startsWith("/shop") },
  { href: "#cart", label: "Cart", icon: ShoppingBag, match: () => false },
  { href: "/track", label: "Orders", icon: ClipboardList, match: (p: string) => p.startsWith("/track") || p.startsWith("/order") },
  { href: "/more", label: "More", icon: Menu, match: (p: string) => p === "/more" || p === "/contact" },
];

export default function TabBar() {
  const pathname = usePathname();
  const { itemCount, isHydrated, openDrawer, isDrawerOpen } = useCart();
  if (isDrawerOpen) return null;

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 border-t border-warm-gray/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          const body = (
            <>
              <span className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-accent/12 text-accent" : "text-secondary-text"}`}>
                <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
                {href === "#cart" && isHydrated && itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] ${active ? "font-semibold text-accent" : "text-secondary-text"}`}>{label}</span>
            </>
          );
          const cls = "flex h-full flex-col items-center justify-center gap-0.5 active:opacity-70";
          return (
            <li key={label}>
              {href === "#cart" ? (
                <button type="button" onClick={() => { tap(); openDrawer(); }} className={`${cls} w-full`} aria-label={`Cart, ${itemCount} items`}>
                  {body}
                </button>
              ) : (
                <Link href={href} className={cls} aria-current={active ? "page" : undefined} onClick={tap}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
