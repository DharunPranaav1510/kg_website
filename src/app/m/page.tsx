import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, MapPin, PhoneCall, Search, ShieldCheck, Star, Truck } from "lucide-react";
import AppBar from "@/components/mobile/AppBar";
import ActiveOrder from "@/components/mobile/ActiveOrder";
import FeaturedRail from "@/components/mobile/FeaturedRail";
import ShopChip from "@/components/mobile/ShopChip";
import ViewSwitch from "@/components/mobile/ViewSwitch";
import { categories } from "@/data/categories";
import { business as staticBusiness } from "@/data/business";
import { getBusiness, getTestimonials } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "KG Foods — Fresh. Hygienic. Trusted.",
  description: staticBusiness.seo.description,
  path: "/",
  ogImage: "/images/hero/hero-main.jpg",
});

const h2 = "font-display text-xl text-primary-text";

export default async function PhoneHome() {
  const [business, testimonials] = await Promise.all([getBusiness(), getTestimonials()]);
  const d = business.delivery;
  return (
    <>
      <AppBar />
      <main className="space-y-7 px-4 pt-4">
        <ActiveOrder />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-primary-text text-white shadow-card">
          <Image src="/images/hero/hero-chicken.jpg" alt="" fill priority sizes="(max-width: 480px) 100vw, 480px" className="object-cover opacity-55" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
          <div className="relative flex min-h-[19rem] flex-col justify-end p-5">
            <ShopChip />
            {business.highlights.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {business.highlights.map((h) => (
                  <li key={h} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"><BadgeCheck size={12} className="text-emerald-300" />{h}</li>
                ))}
              </ul>
            )}
            <h1 className="mt-3 text-balance font-display text-[2rem] leading-[1.08]">Fresh chicken, mutton and eggs, delivered in {business.address.city}.</h1>
            <p className="mt-2 text-sm text-white/80">Pay on delivery · {d.slots.length} delivery slots a day</p>
            <Link href="/shop" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-semibold text-white active:scale-[0.98] active:bg-accent-light">
              Start ordering <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* Search */}
        <form action="/shop" method="get" role="search" className="relative -mt-2">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input name="q" type="search" enterKeyHint="search" placeholder="Search chicken, mutton, eggs…" aria-label="Search products" className="h-12 w-full rounded-full border border-warm-gray bg-white pl-11 pr-4 text-base shadow-soft focus:border-accent/40 focus:outline-none focus:shadow-glow" />
        </form>

        {/* Categories */}
        <section aria-label="Categories">
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4">
            {categories.map((c) => (
              <Link key={c.id} href={c.href} className="flex w-[4.6rem] flex-shrink-0 flex-col items-center gap-1.5 active:opacity-70">
                <span className="relative block h-[4.6rem] w-[4.6rem] overflow-hidden rounded-full border-2 border-white bg-warm-gray shadow-card">
                  <Image src={c.image} alt="" fill sizes="74px" className="object-cover" />
                </span>
                <span className="text-center text-[11px] font-medium leading-tight text-primary-text">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className={h2}>Popular items</h2>
            <Link href="/shop" className="text-sm font-semibold text-accent">See all</Link>
          </div>
          <FeaturedRail />
        </section>

        {/* Delivery info */}
        <section className="rounded-3xl border border-warm-gray/70 bg-white p-4 shadow-soft">
          <h2 className={`${h2} mb-3`}>Delivery in {business.address.city}</h2>
          <ul className="grid grid-cols-3 gap-2 text-center">
            {[
              [Truck, `₹${d.fee}`, d.freeAbove > 0 ? `delivery, free over ₹${d.freeAbove}` : "delivery charge"],
              [ShieldCheck, `₹${d.minOrder}`, "minimum order"],
              [Clock, `${d.slots.length} slots`, "to choose from daily"],
            ].map(([Icon, big, small]) => {
              const I = Icon as typeof Truck;
              return (
                <li key={String(big)} className="rounded-2xl bg-cream px-2 py-3">
                  <I size={18} className="mx-auto mb-1 text-accent" />
                  <p className="text-sm font-bold text-primary-text">{String(big)}</p>
                  <p className="text-[11px] leading-tight text-secondary-text">{String(small)}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-secondary-text"><MapPin size={13} className="text-accent" /> {d.radiusKm > 0 ? `We deliver within ${d.radiusKm} km of the shop. ` : ""}{business.address.full}</p>
        </section>

        {/* How it works */}
        <section>
          <h2 className={`${h2} mb-3`}>How ordering works</h2>
          <ol className="space-y-2.5">
            {[
              ["Pick your cuts", "Add what you need. Prices are per kg or dozen."],
              ["We call you", "Your order is confirmed only after our team phones you."],
              ["Delivery", "We bring it to your door and you pay on delivery."],
            ].map(([t, s], i) => (
              <li key={t} className="flex gap-3 rounded-2xl border border-warm-gray/70 bg-white p-3.5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block text-sm font-semibold text-primary-text">{t}</span>
                  <span className="block text-[13px] leading-snug text-secondary-text">{s}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-[13px] text-amber-900">
            <PhoneCall size={16} className="mt-0.5 flex-shrink-0" /> Keep your phone nearby after ordering. We will call to confirm.
          </p>
        </section>

        {/* Reviews */}
        <section>
          <h2 className={`${h2} mb-3`}>Customer reviews</h2>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
            {testimonials.slice(0, 5).map((t) => (
              <figure key={t.id} className="w-[17rem] flex-shrink-0 snap-start rounded-2xl border border-warm-gray/70 bg-white p-4 shadow-soft">
                <div className="mb-2 flex gap-0.5 text-amber-500" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <blockquote className="line-clamp-5 text-[13px] leading-relaxed text-secondary-text">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-xs"><b className="text-primary-text">{t.name}</b>{t.product ? ` · ${t.product}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <footer className="pb-2 pt-2 text-center text-xs text-secondary-text">
          <p>{business.name} · {business.address.city}</p>
          <p className="mt-1">{business.hours.display}, {business.hours.days}</p>
          <ViewSwitch to="desktop" className="mt-3" />
        </footer>
      </main>
    </>
  );
}
