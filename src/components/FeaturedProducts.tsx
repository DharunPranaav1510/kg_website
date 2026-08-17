import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { featuredProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";

export default function FeaturedProducts() {
  return (
    <section className="py-16 sm:py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <span className="section-label block mb-3">Hand-Picked For You</span>
            <h2 className="section-title">
              Featured <br className="hidden sm:block" />
              Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm font-medium text-accent hover:gap-3 transition-all duration-200"
          >
            See All Products
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} showOriginalPrice />
          ))}
        </div>
      </div>
    </section>
  );
}
