import Link from "next/link";
import { ChevronRight } from "lucide-react";
import LegalPageLayout from "@/components/LegalPageLayout";
import { getPolicyList } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Policies",
  description: "Privacy, terms, delivery, cancellation and refund policies.",
  path: "/policies",
});

export default async function PoliciesPage() {
  const list = await getPolicyList();
  return (
    <LegalPageLayout title="Our Policies" subtitle="How ordering, delivery, cancellations, refunds and your data work." lastUpdated="Always current">
      <ul className="divide-y divide-warm-gray overflow-hidden rounded-2xl border border-warm-gray bg-white">
        {list.map((p) => (
          <li key={p.slug}>
            <Link href={`/${p.slug}`} className="flex items-center justify-between px-5 py-4 font-medium text-primary-text hover:bg-cream">
              {p.title}
              <ChevronRight size={18} className="text-secondary-text" />
            </Link>
          </li>
        ))}
      </ul>
    </LegalPageLayout>
  );
}
