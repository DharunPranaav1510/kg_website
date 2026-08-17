"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import {
  products,
  shopCategories,
  filterProducts,
  sortProducts,
  categoryToShopParam,
  type ShopCategory,
} from "@/data/products";

export default function ShopContent() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("All");

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const category = categoryToShopParam(categoryParam);
      if (category && category !== "All") setActiveCategory(category);
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, activeCategory, "");
    return sortProducts(filtered, "featured");
  }, [activeCategory]);

  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
          {shopCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? "bg-accent text-white shadow-glow"
                  : "bg-white text-secondary-text border border-warm-gray hover:border-accent/30 hover:text-primary-text"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <p className="text-sm text-secondary-text mb-6 sm:mb-8">
          Showing {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"}
          {activeCategory !== "All" && ` in ${activeCategory}`}
        </p>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-soft border border-warm-gray/60 px-4">
            <h3 className="font-display text-xl text-primary-text mb-2">
              No products found
            </h3>
            <p className="text-secondary-text text-sm max-w-sm mx-auto">
              Try selecting a different category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
