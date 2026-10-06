"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Product } from "@/data/products";
import { useBusiness } from "@/context/BusinessContext";
import { useAllProducts } from "@/context/ProductsContext";
import { defaultWeight, priceCart, snapWeight, type PricedCart } from "@/lib/pricing";

const STORAGE_KEY = "kg-foods-cart";
const EXPIRY_KEY = "kg-foods-cart-expiry";
const EXPIRY_HOURS = 24;

export interface CartItem {
  product: Product;
  weightKg: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number; // unique products
  /** Total of the items, before GST that is added on top and before delivery. */
  subtotal: number;
  /** GST added on top of the subtotal (0 when prices already include GST). */
  gstExtra: number;
  /** The priced lines, with offers, GST and the figures printed on the bill. */
  priced: PricedCart;
  isHydrated: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (productId: string, weightKg?: number) => void;
  removeItem: (productId: string) => void;
  updateWeight: (productId: string, weightKg: number) => void;
  clearCart: () => void;
  getWeight: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCartFromStorage(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const expiry = window.localStorage.getItem(EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(EXPIRY_KEY);
      return {};
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

function saveCartToStorage(cart: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  if (!window.localStorage.getItem(EXPIRY_KEY)) {
    const expiry = Date.now() + EXPIRY_HOURS * 60 * 60 * 1000;
    window.localStorage.setItem(EXPIRY_KEY, expiry.toString());
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const products = useAllProducts();
  const tax = useBusiness().tax;
  const [cartMap, setCartMap] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setCartMap(loadCartFromStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveCartToStorage(cartMap);
  }, [cartMap, isHydrated]);

  const items = useMemo<CartItem[]>(() => {
    return Object.entries(cartMap)
      .map(([productId, weightKg]) => {
        const product = products.find((p) => p.id === productId);
        if (!product || weightKg <= 0) return null;
        // An older cart may hold a quantity the shop no longer offers: move to the nearest allowed one.
        return { product, weightKg: snapWeight(product, weightKg) };
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartMap, products]);

  const itemCount = useMemo(() => Object.keys(cartMap).length, [cartMap]);

  const priced = useMemo(() => priceCart(items, tax), [items, tax]);
  const subtotal = priced.subtotal;
  const gstExtra = priced.gstExtra;

  const addItem = useCallback(
    (productId: string, weightKg?: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      // No quantity given: the usual starting quantity. Otherwise the nearest allowed one.
      const w = weightKg === undefined ? defaultWeight(product) : snapWeight(product, weightKg);
      setCartMap((prev) => ({ ...prev, [productId]: w }));
    },
    [products]
  );

  const removeItem = useCallback((productId: string) => {
    setCartMap((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const updateWeight = useCallback(
    (productId: string, weightKg: number) => {
      const w = Number(weightKg);
      if (isNaN(w) || w <= 0) {
        setCartMap((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        return;
      }
      const product = products.find((p) => p.id === productId);
      const clamped = product ? snapWeight(product, w) : Math.round(w * 100) / 100;
      setCartMap((prev) => ({ ...prev, [productId]: clamped }));
    },
    [products]
  );

  const clearCart = useCallback(() => {
    setCartMap({});
  }, []);

  const getWeight = useCallback((productId: string) => items.find((i) => i.product.id === productId)?.weightKg ?? 0, [items]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      gstExtra,
      priced,
      isHydrated,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      removeItem,
      updateWeight,
      clearCart,
      getWeight,
    }),
    [
      items,
      itemCount,
      subtotal,
      gstExtra,
      priced,
      isHydrated,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      removeItem,
      updateWeight,
      clearCart,
      getWeight,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
