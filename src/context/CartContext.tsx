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
import { getProductById, type Product } from "@/data/products";

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
  subtotal: number;
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
        const product = getProductById(productId);
        if (!product || weightKg <= 0) return null;
        return { product, weightKg };
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartMap]);

  const itemCount = useMemo(() => Object.keys(cartMap).length, [cartMap]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const line = Math.round(item.product.pricePerKg * item.weightKg);
      return sum + line;
    }, 0);
  }, [items]);

  const addItem = useCallback((productId: string, weightKg = 0.5) => {
    const w = Math.max(0.25, Math.min(3, Number(weightKg ?? 0.5)));
    // overwrite behavior
    setCartMap((prev) => ({ ...prev, [productId]: w }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartMap((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const updateWeight = useCallback((productId: string, weightKg: number) => {
    const w = Number(weightKg);
    if (isNaN(w) || w <= 0) {
      // remove item if zero or invalid
      setCartMap((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }

    const clamped = Math.max(0.25, Math.min(3, Math.round(w * 100) / 100));
    setCartMap((prev) => ({ ...prev, [productId]: clamped }));
  }, []);

  const clearCart = useCallback(() => {
    setCartMap({});
  }, []);

  const getWeight = useCallback((productId: string) => cartMap[productId] ?? 0, [cartMap]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
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
