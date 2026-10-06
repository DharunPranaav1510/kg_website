import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FeaturedGrid from "@/components/FeaturedGrid";

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

        <FeaturedGrid />
      </div>
    </section>
  );
}
