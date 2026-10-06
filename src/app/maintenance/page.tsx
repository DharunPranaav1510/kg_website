import type { Metadata } from "next";
import Image from "next/image";
import { Clock, MessageSquare, Phone, ShoppingBasket, Snowflake, Truck } from "lucide-react";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: `${business.shortName} | Coming soon`,
  description: "Our new website is under development. Fresh meat, delivered in Hosur, coming soon.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const coming = [
  { icon: ShoppingBasket, title: "Order online", text: "Pick your cuts and send the order in a minute." },
  { icon: Snowflake, title: "Fresh, every day", text: "Cut and packed to order, never stored for days." },
  { icon: Truck, title: "Delivered in Hosur", text: "Pay on delivery, after we confirm by phone." },
];

export default function MaintenancePage() {
  const custom = (process.env.MAINTENANCE_MESSAGE ?? "").trim().slice(0, 240);
  const whatsapp = `https://wa.me/${business.contact.whatsapp.replace("+", "")}`;

  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-5 py-12">
      {/* soft background glow */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-32 -z-10 h-[26rem] w-[26rem] rounded-full bg-[#E8E4DC] blur-3xl" />

      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-warm-gray bg-white shadow-sm">
          <Image src="/images/logo/kg-logo.png" alt={`${business.name} logo`} width={56} height={56} priority className="object-contain" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Under development
        </span>

        <h1 className="mt-6 text-balance font-display text-4xl leading-[1.1] text-primary-text sm:text-5xl">
          Something fresh is <em className="text-accent not-italic">on the way</em>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-secondary-text">
          {custom ||
            `We are putting the finishing touches on the new ${business.shortName} website. Online ordering will be open very soon.`}
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={`tel:${business.contact.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-colors hover:bg-accent-light">
            <Phone size={16} /> Call {business.contact.phoneDisplay}
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-warm-gray bg-white px-7 text-sm font-semibold text-primary-text transition-colors hover:border-accent/40">
            <MessageSquare size={16} /> WhatsApp us
          </a>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-secondary-text">
          <Clock size={14} className="text-accent" /> Shop open {business.hours.display}, {business.hours.days}
        </p>

        <ul className="mt-12 grid gap-3 text-left sm:grid-cols-3">
          {coming.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-warm-gray bg-white/80 p-4 backdrop-blur">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon size={17} strokeWidth={1.75} />
              </span>
              <p className="text-sm font-semibold text-primary-text">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-secondary-text">{text}</p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-secondary-text/70">
          {business.name} · {business.address.city}, {business.address.state}
        </p>
      </div>
    </main>
  );
}
