import { Suspense } from "react";
import { createPageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import DeliveryStrip from "@/components/DeliveryStrip";
import ShopContent from "@/components/ShopContent";
import ShopTrustBar from "@/components/ShopTrustBar";

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
          <div className="h-10 bg-warm-gray rounded-full max-w-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-warm-gray rounded-2xl" />
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
      <DeliveryStrip />
      <main>
        <PageHero
          title="Fresh Products"
          subtitle="Premium poultry, mutton, eggs, and ready-to-cook products — sourced fresh and delivered across Hosur and surrounding areas."
          image="/images/categories/category-chicken.jpg"
          imageAlt="KG Foods fresh chicken and meat products"
          label="Shop"
        />
        <Suspense fallback={<ShopLoading />}>
          <ShopContent />
        </Suspense>
        <ShopTrustBar />
      </main>
      <Footer />
    </>
  );
}
