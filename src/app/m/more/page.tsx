import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Briefcase, ChevronRight, FileText, Info, MessageSquare, Receipt, RotateCcw, ShieldCheck, Truck, XCircle } from "lucide-react";
import AppBar from "@/components/mobile/AppBar";
import ViewSwitch from "@/components/mobile/ViewSwitch";
import { business } from "@/data/business";
import { getPolicyList } from "@/lib/content";

export const metadata: Metadata = { title: "More — KG Foods", robots: { index: false, follow: true } };

const groups: { title: string; rows: { href: string; label: string; icon: typeof Info }[] }[] = [
  {
    title: "KG Foods",
    rows: [
      { href: "/contact", label: "Contact us", icon: MessageSquare },
      { href: "/about", label: "About us", icon: Info },
      { href: "/blog", label: "Blog", icon: BookOpen },
      { href: "/careers", label: "Careers", icon: Briefcase },
    ],
  },
  {
    title: "Policies",
    rows: [],
  },
];

const policyIcons = { privacy: ShieldCheck, terms: FileText, refunds: RotateCcw, cancellation: XCircle, delivery: Truck } as const;

export default async function PhoneMore() {
  const policies = await getPolicyList();
  const groupsWithPolicies = groups.map((g) => g.title === "Policies" ? { ...g, rows: policies.map((p) => ({ href: `/${p.slug}`, label: p.title, icon: policyIcons[p.slug] })) } : g);
  return (
    <>
      <AppBar title="More" />
      <main className="space-y-6 px-4 pt-5">
        {groupsWithPolicies.map((g) => (          <section key={g.title}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-text">{g.title}</h2>
            <ul className="overflow-hidden rounded-2xl border border-warm-gray/70 bg-white shadow-soft">
              {g.rows.map(({ href, label, icon: Icon }) => (
                <li key={href} className="border-b border-warm-gray/60 last:border-0">
                  <Link href={href} className="flex min-h-14 items-center gap-3 px-4 active:bg-warm-gray/50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon size={17} /></span>
                    <span className="flex-1 text-sm font-medium text-primary-text">{label}</span>
                    <ChevronRight size={18} className="text-secondary-text" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <div className="pb-2 text-center text-xs text-secondary-text">
          <p className="flex items-center justify-center gap-1.5"><Receipt size={13} /> {business.name} · {business.address.city}</p>
          <ViewSwitch to="desktop" className="mt-3" />
        </div>
      </main>
    </>
  );
}
