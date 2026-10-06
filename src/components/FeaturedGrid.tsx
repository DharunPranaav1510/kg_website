"use client";

import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";

export default function FeaturedGrid() {
  const featured = useProducts().filter((p) => p.featured);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {featured.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
