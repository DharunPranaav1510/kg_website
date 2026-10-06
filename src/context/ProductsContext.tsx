"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { isHiddenNow, unavailableNote } from "@/lib/pricing";

interface Value {
  /** What the shop shows right now (products hidden by their schedule are left out). */
  visible: Product[];
  /** Everything, for the cart: an item that goes out of its time window must still be listed there. */
  all: Product[];
}

const ProductsContext = createContext<Value | null>(null);

/**
 * Time and date rules are checked in the browser against the clock, and re-checked every
 * 30 seconds, so a product appears and disappears on time even on a cached page.
 */
export function ProductsProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    const onShow = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);

  const value = useMemo<Value>(() => {
    const all = products.map((p): Product => {
      const note = now === null ? null : unavailableNote(p, now);
      return note ? { ...p, unavailableNote: note } : p;
    });
    // Before the browser knows the time, hide what would be hidden at some times, so it never flashes in.
    const visible = all.filter((p) => (now === null ? !p.schedule?.hideWhenUnavailable : !isHiddenNow(p, now)));
    return { visible, all };
  }, [products, now]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

function useValue() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts must be used within a ProductsProvider");
  return context;
}

export const useProducts = () => useValue().visible;
export const useAllProducts = () => useValue().all;
