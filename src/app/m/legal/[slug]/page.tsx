import AppBar from "@/components/mobile/AppBar";
import Markdown from "@/components/Markdown";
import { loadPolicy } from "@/components/PolicyView";
import { createPageMetadata } from "@/lib/seo";
import type { PolicySlug } from "@/data/policy-defaults";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await loadPolicy(slug);
  return createPageMetadata({ title: p.title, description: p.subtitle || p.title, path: `/${slug as PolicySlug}` });
}

export default async function PhonePolicy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await loadPolicy(slug);
  return (
    <>
      <AppBar title={p.title} back="/more" />
      <main className="px-4 pb-6 pt-5">
        {p.subtitle && <p className="mb-1 text-[15px] text-secondary-text">{p.subtitle}</p>}
        <p className="mb-5 text-xs text-secondary-text/80">Last updated: {p.dateText}</p>
        <Markdown text={p.body} className="text-[15px] leading-relaxed text-secondary-text" />
      </main>
    </>
  );
}
