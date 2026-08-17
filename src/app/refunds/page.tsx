import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = createPageMetadata({
  title: "Refund Policy",
  description: "KG Foods refund and replacement policy for fresh meat and poultry orders.",
  path: "/refunds",
});

export default function RefundsPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      subtitle="We stand behind the freshness and quality of every product we deliver."
      lastUpdated="June 1, 2025"
    >
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Quality Guarantee</h2>
        <p>
          If you receive a product that does not meet our freshness standards — including
          off-odour, discolouration, or damaged packaging — contact us within 2 hours of
          delivery with a photo. We will arrange a full replacement or refund at no extra cost.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Eligible Refunds</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Products delivered in damaged or compromised cold-chain packaging</li>
          <li>Incorrect items delivered compared to your confirmed order</li>
          <li>Products that fail our freshness check upon delivery</li>
        </ul>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Non-Eligible Refunds</h2>
        <p>
          Refunds are not available for products that have been cooked, frozen after delivery
          by the customer, or stored improperly. Change-of-mind returns are not accepted for
          perishable food items as per FSSAI guidelines.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">How to Request a Refund</h2>
        <p>
          Call us at +91 98765 43210 or email info@kgfoods.com with your order number and a
          brief description. Refunds are processed within 3–5 business days to your original
          payment method.
        </p>
      </div>
    </LegalPageLayout>
  );
}
