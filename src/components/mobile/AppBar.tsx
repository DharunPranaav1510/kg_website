"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Lock, Phone } from "lucide-react";
import { business } from "@/data/business";
import { useShopStatus } from "@/context/ShopStatusContext";

export default function AppBar({ title, back }: { title?: string; back?: string }) {
  const shop = useShopStatus();
  return (
    <header className="sticky top-0 z-40 border-b border-warm-gray/70 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3">
        {back ? (
          <Link href={back} aria-label="Back" className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full text-primary-text active:bg-warm-gray">
            <ChevronLeft size={24} />
          </Link>
        ) : null}
        {title ? (
          <h1 className="font-display text-xl text-primary-text">{title}</h1>
        ) : (
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${business.name} home`}>
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-warm-gray bg-white">
              <Image src="/images/logo/kg-logo.png" alt="" width={28} height={28} className="object-contain" priority />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[17px] text-primary-text">{business.shortName}</span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-secondary-text">Hosur</span>
            </span>
          </Link>
        )}
        <a
          href={`tel:${business.contact.phone}`}
          aria-label={`Call ${business.name}`}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-accent/10 px-3.5 text-sm font-semibold text-accent active:bg-accent/20"
        >
          <Phone size={15} /> Call
        </a>
      </div>
      {!shop.open && (
        <p role="status" className="flex items-start gap-2 bg-primary-text px-4 py-2 text-xs text-white">
          <Lock size={13} className="mt-0.5 flex-shrink-0" />
          <span><b>Orders paused.</b> {shop.message || "We're closed right now. Please check back soon."}</span>
        </p>
      )}
    </header>
  );
}
