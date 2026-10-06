"use client";

import { BusinessProvider } from "@/context/BusinessContext";
import type { Business } from "@/lib/content-schema";
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
  business,
  children,
}: {
  products: Product[];
  shop: ShopStatus;
  business: Business;
  children: React.ReactNode;
}) {
  return (
    <BusinessProvider business={business}>
      <ShopStatusProvider status={shop}>
        <ProductsProvider products={products}>
          <CartProvider>
            {children}
            <CartDrawer />
            <CartBar />
          </CartProvider>
        </ProductsProvider>
      </ShopStatusProvider>
    </BusinessProvider>
  );
}
