import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";
import { business } from "@/data/business";

export const metadata = createPageMetadata({
  title: "Refund & Replacement Policy",
  description: "How refunds and replacements work for fresh meat and poultry orders from KG Foods.",
  path: "/refunds",
});

const h2 = "font-display text-xl text-primary-text mb-3";
const link = "text-accent hover:underline";

export default function RefundsPage() {
  return (
    <LegalPageLayout
      title="Refund & Replacement"
      subtitle="We stand behind the freshness and quality of every product we deliver."
      lastUpdated="October 6, 2026"
    >
      <div>
        <h2 className={h2}>How you pay</h2>
        <p>
          Orders are paid on delivery (cash or UPI to the delivery person). We do not take
          card or bank details on this website. Because nothing is paid in advance, a refund
          means we either do not charge you, give your money back at your door, or send a
          replacement.
        </p>
      </div>
      <div>
        <h2 className={h2}>Quality guarantee</h2>
        <p>
          If something you receive is not fresh (bad smell, discolouration, damaged or leaking
          packaging), tell us within 2 hours of delivery with a clear photo. We will replace it
          or refund it, whichever you prefer.
        </p>
      </div>
      <div>
        <h2 className={h2}>When we will refund or replace</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>The product is not fresh or the packaging is damaged.</li>
          <li>You received a different item from what we confirmed on the call.</li>
          <li>The weight is noticeably less than what you were charged for.</li>
        </ul>
      </div>
      <div>
        <h2 className={h2}>When we cannot</h2>
        <p>
          Fresh meat and eggs are perishable, so we cannot accept change-of-mind returns. We
          also cannot refund products that were cooked, frozen or stored incorrectly after
          delivery, or problems reported after the 2 hour window.
        </p>
      </div>
      <div>
        <h2 className={h2}>How to ask</h2>
        <p>
          Call{" "}
          <a className={link} href={`tel:${business.contact.phone}`}>{business.contact.phoneDisplay}</a>{" "}
          or message us on WhatsApp with your order number and a photo. If a refund is due, we
          return the money by the same way you paid (cash or UPI) as soon as we have checked
          the issue, usually the same day.
        </p>
      </div>
      <div>
        <h2 className={h2}>Related</h2>
        <p>
          See our <Link className={link} href="/cancellation">Cancellation Policy</Link> and{" "}
          <Link className={link} href="/delivery">Delivery Policy</Link>.
        </p>
      </div>
    </LegalPageLayout>
  );
}
