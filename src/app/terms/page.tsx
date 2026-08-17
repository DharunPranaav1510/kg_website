import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description: "Terms and conditions for ordering from KG Foods in Hosur, Tamil Nadu.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="Please read these terms before placing an order with KG Foods."
      lastUpdated="June 1, 2025"
    >
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Orders &amp; Availability</h2>
        <p>
          All products are subject to availability. KG Foods reserves the right to substitute
          items of equal or greater value if a specific cut is unavailable. Prices listed on
          our website are inclusive of applicable taxes unless stated otherwise.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Delivery</h2>
        <p>
          We deliver across select Hosur neighbourhoods using cold-chain packaging. Delivery
          slots are confirmed by phone after order placement. Same-day delivery is available for
          orders placed before 12:00 PM in eligible areas.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Product Quality</h2>
        <p>
          All meat and poultry products are processed in our facility following strict hygiene
          standards. Products must be refrigerated upon receipt. KG Foods is not liable for spoilage caused by
          improper storage after delivery.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Limitation of Liability</h2>
        <p>
          KG Foods&apos;s liability is limited to the value of the products purchased. We are not
          responsible for indirect or consequential damages arising from product use.
        </p>
      </div>
    </LegalPageLayout>
  );
}
