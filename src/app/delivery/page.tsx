import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";
import { business } from "@/data/business";

export const metadata = createPageMetadata({
  title: "Delivery Policy",
  description: "Delivery areas, time slots, charges and minimum order for KG Foods in Hosur.",
  path: "/delivery",
});

const h2 = "font-display text-xl text-primary-text mb-3";
const link = "text-accent hover:underline";
const d = business.delivery;

export default function DeliveryPage() {
  return (
    <LegalPageLayout
      title="Delivery Policy"
      subtitle={`Fresh meat, delivered across ${business.address.city}.`}
      lastUpdated="October 6, 2026"
    >
      <div>
        <h2 className={h2}>Where we deliver</h2>
        <p>
          We deliver within {business.address.city}. Areas we usually cover include{" "}
          {d.areas.join(", ")}. If your area is not listed, call us and we will tell you if we
          can reach you.
        </p>
      </div>
      <div>
        <h2 className={h2}>Minimum order and charges</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Minimum order: ₹{d.minOrder}.</li>
          <li>
            Delivery charge: ₹{d.fee}. It is free on orders of ₹{d.freeAbove} or more.
          </li>
          <li>Prices are per kg and the final bill is for the weight we actually pack.</li>
        </ul>
      </div>
      <div>
        <h2 className={h2}>Time slots</h2>
        <ul className="list-disc pl-5 space-y-2">
          {d.slots.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3">
          The slot you pick is a preference. We confirm the exact time when we call you, and
          delivery can take longer during rush hours or bad weather.
        </p>
      </div>
      <div>
        <h2 className={h2}>How it works</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>You send an order on the website.</li>
          <li>Someone from {business.name} calls to confirm it. It is not confirmed before this.</li>
          <li>We prepare it fresh and deliver it in the slot we agreed.</li>
          <li>You pay on delivery.</li>
        </ol>
      </div>
      <div>
        <h2 className={h2}>If nobody is available</h2>
        <p>
          Please keep your phone on. If we cannot reach you after a few tries, we may cancel the
          order. See our <Link className={link} href="/cancellation">Cancellation Policy</Link>.
          For quality problems see our <Link className={link} href="/refunds">Refund &amp; Replacement policy</Link>.
        </p>
      </div>
      <div>
        <h2 className={h2}>Contact</h2>
        <p>
          Call <a className={link} href={`tel:${business.contact.phone}`}>{business.contact.phoneDisplay}</a>,
          open {business.hours.display}, {business.hours.days}.
        </p>
      </div>
    </LegalPageLayout>
  );
}
