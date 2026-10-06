import { Suspense } from "react";
import AppBar from "@/components/mobile/AppBar";
import MShop from "@/components/mobile/MShop";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Shop Fresh Products",
  description:
    "Browse farm-fresh chicken, mutton, eggs, frozen products, and ready-to-cook items from KG Foods. Order online with same-day delivery in Hosur.",
  path: "/shop",
  ogImage: "/images/categories/category-chicken.jpg",
});

export default function PhoneShop() {
  return (
    <>
      <AppBar title="Shop" />
      <main>
        <Suspense fallback={<div className="grid grid-cols-2 gap-3 px-3 pt-24">{[1, 2, 3, 4].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-warm-gray" />)}</div>}>
          <MShop />
        </Suspense>
      </main>
    </>
  );
}
