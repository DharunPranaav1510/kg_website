import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";
import { business } from "@/data/business";

export const metadata = createPageMetadata({
  title: "Cancellation Policy",
  description: "How to cancel an order with KG Foods, and when we may cancel one.",
  path: "/cancellation",
});

const h2 = "font-display text-xl text-primary-text mb-3";
const link = "text-accent hover:underline";

export default function CancellationPage() {
  return (
    <LegalPageLayout
      title="Cancellation Policy"
      subtitle="Changed your mind? Here is how cancelling works."
      lastUpdated="October 6, 2026"
    >
      <div>
        <h2 className={h2}>When an order is confirmed</h2>
        <p>
          Sending an order on the website is a request. It becomes a confirmed order only after
          someone from {business.name} calls you and confirms the items, price and time. Until
          then you can cancel freely and you owe nothing.
        </p>
      </div>
      <div>
        <h2 className={h2}>Cancelling as a customer</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Before we call, or before we start preparing it:</strong> cancel at no
            charge.
          </li>
          <li>
            <strong>After your meat has been cut, cleaned or packed to order:</strong> we may
            not be able to cancel, because fresh meat cannot be resold.
          </li>
          <li>
            <strong>Out for delivery:</strong> please call us. If you refuse delivery without a
            reason, we may ask you to confirm the next order by calling first.
          </li>
        </ul>
        <p className="mt-3">
          To cancel, call{" "}
          <a className={link} href={`tel:${business.contact.phone}`}>{business.contact.phoneDisplay}</a>{" "}
          or message us on WhatsApp with your order number.
        </p>
      </div>
      <div>
        <h2 className={h2}>When we may cancel</h2>
        <p>
          We may cancel an order if an item is out of stock, the address is outside our delivery
          area, we cannot reach you on the number given, or the order looks fake or abusive.
          We will tell you, and you are never charged for an order we cancel. Repeated false
          orders can lead to a number being blocked.
        </p>
      </div>
      <div>
        <h2 className={h2}>Payment</h2>
        <p>
          You pay on delivery, so cancelling before delivery needs no refund. For problems after
          delivery see our <Link className={link} href="/refunds">Refund &amp; Replacement policy</Link>.
        </p>
      </div>
    </LegalPageLayout>
  );
}
