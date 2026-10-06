import { notFound } from "next/navigation";
import LegalPageLayout from "@/components/LegalPageLayout";
import Markdown from "@/components/Markdown";
import { formatPolicyDate, getBusiness, getPolicy, isPolicySlug } from "@/lib/content";
import { fillVars, policyVariables } from "@/lib/content-schema";
import { createPageMetadata } from "@/lib/seo";
import type { PolicySlug } from "@/data/policy-defaults";

/** A policy as customers read it: the admin-edited text with {{placeholders}} filled in. */
export async function loadPolicy(slug: string) {
  if (!isPolicySlug(slug)) notFound();
  const [policy, business] = await Promise.all([getPolicy(slug), getBusiness()]);
  return {
    ...policy,
    body: fillVars(policy.body, policyVariables(business)),
    subtitle: fillVars(policy.subtitle, policyVariables(business)),
    dateText: formatPolicyDate(policy.updatedAt),
  };
}

export async function policyMetadata(slug: PolicySlug) {
  const p = await loadPolicy(slug);
  return createPageMetadata({ title: p.title, description: p.subtitle || p.title, path: `/${slug}` });
}

export default async function PolicyPage({ slug }: { slug: PolicySlug }) {
  const p = await loadPolicy(slug);
  return (
    <LegalPageLayout title={p.title} subtitle={p.subtitle} lastUpdated={p.dateText}>
      <Markdown text={p.body} />
    </LegalPageLayout>
  );
}
