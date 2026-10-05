"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/data/products";

const ProductsContext = createContext<Product[] | null>(null);

export function ProductsProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  return (
    <ProductsContext.Provider value={products}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
}
