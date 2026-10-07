"use client";

import Link from "next/link";
import { Clock, Moon, Phone } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import NightSky from "@/components/NightSky";
import OpensIn from "@/components/OpensIn";

/** Shown on the home page instead of the big banner while the shop is closed or orders are paused. */
export default function ShopHero({ children }: { children: React.ReactNode }) {
  const shop = useShopStatus();
  const business = useBusiness();
  if (shop.open) return <>{children}</>;

  const paused = shop.reason === "paused";
  return (
    <section aria-label="Shop closed" className="relative isolate overflow-hidden bg-[#080b18] text-white">
      <NightSky />
      <div className="relative mx-auto grid min-h-[34rem] max-w-7xl gap-10 px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:px-8">
        <div className="kg-rise">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200 backdrop-blur">
            <Moon size={14} /> {paused ? "Orders paused" : "Closed right now"}
          </span>
          <h1 className="font-display text-4xl leading-[1.08] text-balance drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl">
            {paused ? "We're not taking orders at the moment" : shop.opensLabel ? <>We&apos;re back <em className="not-italic bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">{shop.opensLabel}</em></> : "We're closed right now"}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">{shop.message}</p>
          {!paused && <div className="mt-5"><OpensIn /></div>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-primary-text shadow-[0_10px_40px_-10px_rgba(255,255,255,0.45)] transition-transform hover:scale-[1.03]">See what we sell</Link>
            <a href={`tel:${business.contact.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/15"><Phone size={16} /> {business.contact.phoneDisplay}</a>
          </div>
          <p className="mt-4 text-sm text-white/55">You can look around now. Ordering opens when we do.</p>
        </div>

        <div className="relative lg:pt-10">
          {/* the sign on the door */}
          <div aria-hidden className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 lg:block">
            <div className="kg-sign flex flex-col items-center">
              <div className="flex gap-16"><span className="h-8 w-px bg-white/50" /><span className="h-8 w-px bg-white/50" /></div>
              <div className="rounded-xl border-2 border-amber-200/70 bg-[#2a1d1b] px-7 py-2 text-center shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                <p className="font-display text-xl tracking-[0.2em] text-amber-100">CLOSED</p>
                <p className="text-[11px] uppercase tracking-widest text-amber-100/60">See you soon</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-6 pt-16 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md sm:p-8 sm:pt-20">
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
      </div>
    </section>
  );
}
