"use client";

import { useProducts } from "@/context/ProductsContext";
import MProductCard from "./MProductCard";

export default function FeaturedRail() {
  const products = useProducts();
  const picks = products.filter((p) => p.featured && p.inStock !== false);
  const list = (picks.length >= 4 ? picks : products.filter((p) => p.inStock !== false)).slice(0, 8);
  if (!list.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
      {list.map((p) => (
        <div key={p.id} className="w-[10.5rem] flex-shrink-0 snap-start">
          <MProductCard product={p} className="h-full" />
        </div>
      ))}
    </div>
  );
}
