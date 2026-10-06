"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Moon, Phone } from "lucide-react";
import { useShopStatus } from "@/context/ShopStatusContext";
import ShopChip from "./ShopChip";

/** The phone home banner. Open: the usual pitch. Closed: a calmer night view with when we are back. */
export default function HomeHero({
  city,
  slotCount,
  highlights,
  phone,
  phoneDisplay,
  hoursLines,
}: {
  city: string;
  slotCount: number;
  highlights: string[];
  phone: string;
  phoneDisplay: string;
  hoursLines: string[];
}) {
  const shop = useShopStatus();
  const closed = !shop.open;
  return (
    <section className={`relative overflow-hidden rounded-3xl text-white shadow-card ${closed ? "bg-[#14161c]" : "bg-primary-text"}`}>
      <Image src="/images/hero/hero-chicken.jpg" alt="" fill priority sizes="(max-width: 480px) 100vw, 480px" className={`object-cover ${closed ? "opacity-25 saturate-50" : "opacity-55"}`} />
      <div aria-hidden className={`absolute inset-0 ${closed ? "bg-gradient-to-t from-[#14161c] via-[#14161c]/80 to-[#1d2433]/40" : "bg-gradient-to-t from-black/85 via-black/45 to-black/10"}`} />
      <div className="relative flex min-h-[19rem] flex-col justify-end p-5">
        {closed && <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-amber-200"><Moon size={24} /></span>}
        <ShopChip />
        {!closed && highlights.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <li key={h} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"><BadgeCheck size={12} className="text-emerald-300" />{h}</li>
            ))}
          </ul>
        )}

        {closed ? (
          <>
            <h1 className="mt-3 text-balance font-display text-[1.9rem] leading-[1.1]">
              {shop.reason === "paused" ? "Orders are paused for now" : "We're closed right now"}
            </h1>
            <p className="mt-2 text-sm text-white/80">{shop.message}</p>
            {hoursLines.length > 0 && (
              <ul className="mt-3 space-y-0.5 text-xs text-white/70">
                {hoursLines.map((l) => <li key={l}>{l}</li>)}
              </ul>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/shop" className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-primary-text active:scale-[0.98]">See the menu</Link>
              <a href={`tel:${phone}`} className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 text-[15px] font-semibold text-white active:bg-white/10"><Phone size={16} /> Call</a>
            </div>
            <p className="mt-2 text-center text-[11px] text-white/60">You can browse now. Ordering opens when we do · {phoneDisplay}</p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-balance font-display text-[2rem] leading-[1.08]">Fresh chicken, mutton and eggs, delivered in {city}.</h1>
            <p className="mt-2 text-sm text-white/80">Pay on delivery · {slotCount} delivery slots a day</p>
            <Link href="/shop" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-semibold text-white active:scale-[0.98] active:bg-accent-light">
              Start ordering <ArrowRight size={17} />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
