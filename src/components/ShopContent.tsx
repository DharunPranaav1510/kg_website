"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PackageOpen } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";
import {
  shopCategories,
  filterProducts,
  sortProducts,
  categoryToShopParam,
  type ShopCategory,
} from "@/data/products";

export default function ShopContent() {
  const products = useProducts();
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
  }, [products, activeCategory]);

  return (
    <section className="pb-8 sm:pb-12 bg-background">
      <div className="sticky top-16 sm:top-[4.5rem] z-40 bg-background/95 backdrop-blur-md border-b border-warm-gray/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap gap-2">
            {shopCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-accent text-white shadow-glow scale-[1.02]"
                    : "bg-white text-secondary-text border border-warm-gray hover:border-accent/30 hover:text-primary-text"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
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
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-soft border border-warm-gray/60 px-6">
            <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
              <PackageOpen size={24} className="text-secondary-text" />
            </div>
            <h3 className="font-display text-xl text-primary-text mb-2">
              No products in this category
            </h3>
            <p className="text-secondary-text text-sm max-w-sm mx-auto mb-6">
              Try browsing all products or pick a different category.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className="btn-secondary text-sm py-3 px-6"
            >
              View All Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
