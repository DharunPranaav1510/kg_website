"use client";

import { CartProvider } from "@/context/CartContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { ShopStatusProvider } from "@/context/ShopStatusContext";
import type { ShopStatus } from "@/lib/settings";
import CartBar from "@/components/CartBar";
import CartDrawer from "@/components/CartDrawer";
import type { Product } from "@/data/products";

export default function Providers({
  products,
  shop,
  children,
}: {
  products: Product[];
  shop: ShopStatus;
  children: React.ReactNode;
}) {
  return (
    <ShopStatusProvider status={shop}>
      <ProductsProvider products={products}>
        <CartProvider>
          {children}
          <CartDrawer />
          <CartBar />
        </CartProvider>
      </ProductsProvider>
    </ShopStatusProvider>
  );
}
