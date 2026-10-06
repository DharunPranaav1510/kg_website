"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageOpen, Search, X } from "lucide-react";
import { useProducts } from "@/context/ProductsContext";
import { categoryToShopParam, filterProducts, shopCategories, sortProducts, type ShopCategory } from "@/data/products";
import MProductCard from "./MProductCard";

export default function MShop() {
  const products = useProducts();
  const params = useSearchParams();
  const [category, setCategory] = useState<ShopCategory>("All");
  const [query, setQuery] = useState("");
  const chips = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = params.get("category");
    const mapped = c ? categoryToShopParam(c) : null;
    if (mapped) setCategory(mapped);
    const q = params.get("q");
    if (q) setQuery(q.slice(0, 60));
  }, [params]);

  useEffect(() => {
    chips.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [category]);

  const list = useMemo(() => sortProducts(filterProducts(products, category, query), "featured"), [products, category, query]);

  return (
    <>
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mt-px border-b border-warm-gray/70 bg-background/95 backdrop-blur-xl">
        <div className="relative px-3 pt-3">
          <Search size={17} className="pointer-events-none absolute left-6 top-[1.45rem] text-secondary-text" />
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chicken, mutton, eggs…"
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-warm-gray bg-white pl-10 pr-10 text-base focus:border-accent/40 focus:outline-none focus:shadow-glow"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-[0.9rem] flex h-9 w-9 items-center justify-center text-secondary-text">
              <X size={16} />
            </button>
          )}
        </div>
        <div ref={chips} className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3 pt-2.5">
          {shopCategories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${category === c ? "bg-accent text-white shadow-soft" : "border border-warm-gray bg-white text-secondary-text active:bg-warm-gray"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-4">
        <p className="mb-3 text-xs text-secondary-text">
          {list.length} {list.length === 1 ? "item" : "items"}
          {category !== "All" && ` in ${category}`}
          {query.trim() && ` for “${query.trim()}”`}
        </p>
        {list.length ? (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => <MProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-warm-gray/70 bg-white px-6 py-14 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream"><PackageOpen size={22} className="text-secondary-text" /></span>
            <p className="font-display text-lg">Nothing found</p>
            <p className="mt-1 text-sm text-secondary-text">Try another word or category.</p>
            <button type="button" onClick={() => { setCategory("All"); setQuery(""); }} className="mt-5 rounded-full border border-warm-gray px-6 py-3 text-sm font-medium active:bg-warm-gray">Show everything</button>
          </div>
        )}
      </div>
    </>
  );
}
