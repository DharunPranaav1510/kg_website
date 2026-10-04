"use client";

import { CartProvider } from "@/context/CartContext";
import { ProductsProvider } from "@/context/ProductsContext";
import CartBar from "@/components/CartBar";
import CartDrawer from "@/components/CartDrawer";
import type { Product } from "@/data/products";

export default function Providers({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  return (
    <ProductsProvider products={products}>
      <CartProvider>
        {children}
        <CartDrawer />
        <CartBar />
      </CartProvider>
    </ProductsProvider>
  );
}
