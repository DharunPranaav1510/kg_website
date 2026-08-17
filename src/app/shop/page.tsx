import { Suspense } from "react";
import { createPageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopContent from "@/components/ShopContent";

export const metadata = createPageMetadata({
  title: "Shop Fresh Products",
  description:
    "Browse farm-fresh chicken, mutton, eggs, frozen products, and ready-to-cook items from KG Foods. Order online with same-day delivery in Hosur.",
  path: "/shop",
  ogImage: "/images/categories/category-chicken.jpg",
});

function ShopLoading() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-warm-gray rounded-full max-w-md" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] bg-warm-gray rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="pt-28 pb-6 text-center px-4">
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-accent">
            Shop
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-primary-text mt-3 mb-4">
            Fresh Products
          </h1>
          <p className="text-secondary-text text-lg max-w-xl mx-auto">
            Premium poultry, mutton, eggs, and ready-to-cook products — sourced
            fresh and delivered across Hosur and surrounding areas.
          </p>
        </div>

        <Suspense fallback={<ShopLoading />}>
          <ShopContent />
        </Suspense>

        <div className="border-y border-warm-gray bg-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 sm:gap-12 flex-wrap text-xs sm:text-sm text-secondary-text font-medium">
            <span className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Sourced Daily
            </span>
            <span className="w-px h-4 bg-warm-gray hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-accent">❄</span> Cold-chain Delivery
            </span>
            <span className="w-px h-4 bg-warm-gray hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-accent">✓</span> FSSAI Certified
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
