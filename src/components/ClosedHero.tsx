"use client";

import Link from "next/link";
import { Clock, Moon, Phone } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { useShopStatus } from "@/context/ShopStatusContext";

/** Shown on the home page instead of the big banner while the shop is closed or orders are paused. */
export default function ShopHero({ children }: { children: React.ReactNode }) {
  const shop = useShopStatus();
  const business = useBusiness();
  if (shop.open) return <>{children}</>;

  return (
    <section aria-label="Shop closed" className="relative overflow-hidden bg-[#14161c] text-white">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_20%,rgba(120,140,200,0.25),transparent),radial-gradient(40%_60%_at_10%_90%,rgba(214,62,10,0.18),transparent)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            <Moon size={14} /> {shop.reason === "paused" ? "Orders paused" : "Closed right now"}
          </span>
          <h1 className="font-display text-4xl leading-[1.08] text-balance sm:text-6xl">
            {shop.reason === "paused" ? "We're not taking orders at the moment" : shop.opensLabel ? <>We&apos;re back <em className="not-italic text-amber-300">{shop.opensLabel}</em></> : "We're closed right now"}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">{shop.message}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-primary-text transition-transform hover:scale-[1.02]">See what we sell</Link>
            <a href={`tel:${business.contact.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-8 text-sm font-semibold transition-colors hover:bg-white/10"><Phone size={16} /> {business.contact.phoneDisplay}</a>
          </div>
          <p className="mt-4 text-sm text-white/55">You can look around now. Ordering opens when we do.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl"><Clock size={18} className="text-amber-300" /> Opening hours</h2>
          <ul className="space-y-2.5 text-[15px]">
            {business.hours.lines.map((l) => {
              const [days, hours] = l.split(": ");
              return (
                <li key={l} className="flex justify-between gap-4 border-b border-white/10 pb-2 last:border-0">
                  <span className="text-white/70">{days}</span>
                  <b className={hours === "Closed" ? "text-white/50" : ""}>{hours}</b>
                </li>
              );
            })}
          </ul>
          {business.hours.schedule.exceptions.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).slice(0, 3).map((e) => (
            <p key={e.date} className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
              <b>{new Date(e.date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}</b>: {e.closed ? "closed" : `${e.from} – ${e.to}`}{e.note ? ` (${e.note})` : ""}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
