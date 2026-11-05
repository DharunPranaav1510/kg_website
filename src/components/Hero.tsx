"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useShopStatus } from "@/context/ShopStatusContext";

const INTERVAL = 8000;

const heroSlides = [
  {
    id: "chicken",
    name: "Chicken",
    image: "/images/hero/hero-chicken.jpg",
    headline: ["Farm-Fresh", "Chicken"],
    subtext:
      "Antibiotic-free, farm-raised chicken — cleaned, cut, and delivered to your door within 24 hours.",
    shopHref: "/shop?category=Chicken",
  },
  {
    id: "mutton",
    name: "Mutton",
    image: "/images/hero/hero-mutton.jpg",
    headline: ["Premium", "Mutton Cuts"],
    subtext:
      "Tender, grain-fed mutton — hand-selected by our butchers for flavour, texture, and freshness.",
    shopHref: "/shop?category=Mutton",
  },
  {
    id: "eggs",
    name: "Eggs",
    image: "/images/hero/hero-eggs.jpg",
    headline: ["Free-Range", "Farm Eggs"],
    subtext:
      "Rich, golden-yolk eggs from free-range hens — naturally raised and delivered fresh every morning.",
    shopHref: "/shop?category=Eggs",
  },
  {
    id: "ready-to-cook",
    name: "Ready-to-Cook",
    image: "/images/hero/hero-ready-to-cook.jpg",
    headline: ["Ready-to-Cook", "Meals"],
    subtext:
      "Marinated, seasoned, and oven-ready — restaurant-quality meals on your table in under 30 minutes.",
    shopHref: "/shop?category=Ready%20To%20Cook",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const router = useRouter();
  const touchX = useRef<number | null>(null);
  const shop = useShopStatus();

  const goTo = useCallback((index: number) => {
    setFading(true);
    window.setTimeout(() => {
      setCurrent((index + heroSlides.length) % heroSlides.length);
      setFading(false);
    }, 350);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const timer = window.setInterval(next, INTERVAL);
    return () => window.clearInterval(timer);
  }, [next]);

  const slide = heroSlides[current];

  return (
    <section
      className="relative w-full min-h-[85vh] lg:min-h-screen overflow-hidden bg-[#1a120e]"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
      }}
    >
      {/* Full-bleed photo stack — soft crossfade, gentle ken burns on active */}
      <div className="absolute inset-0" aria-hidden>
        {heroSlides.map((s, index) => {
          const active = index === current;
          return (
            <div
              key={s.id}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{ opacity: active ? 1 : 0 }}
            >
              <Image
                key={active ? `${s.id}-live` : s.id}
                src={s.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                quality={90}
                className={`object-cover object-[42%_40%] ${active ? "kg-hero-pan" : ""}`}
              />
            </div>
          );
        })}
      </div>

      {/* Clean scrims: text legibility on the left, keep food sharp on the right */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(55% 70% at 72% 48%, transparent 0%, transparent 42%, rgba(0,0,0,0.28) 100%)",
        }}
      />

      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 items-center justify-center"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 items-center justify-center"
      >
        <ChevronRight size={22} />
      </button>

      <div className="relative z-20 flex flex-col min-h-[85vh] lg:min-h-screen px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="h-2 sm:h-4" />

        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          <span className="kg-rise mb-4 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md sm:text-sm">
            <span className="kg-live-dot" aria-hidden="true" />
            {shop.extended
              ? `Open late · taking orders until ${shop.closesAt}`
              : shop.closesAt
                ? `Open now · taking orders until ${shop.closesAt}`
                : "Open now · taking orders"}
          </span>
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-8 h-px bg-white/70" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-white/80">
              Farm to Your Table
            </span>
          </div>

          <h1
            className="font-display text-white leading-[1.06] mb-4 sm:mb-5"
            style={{
              fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(12px)" : "translateY(0)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
            }}
          >
            {slide.headline[0]}
            <br />
            <span className="bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
              {slide.headline[1]}
            </span>
          </h1>

          <p
            className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-md"
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(8px)" : "translateY(0)",
              transition: "opacity 0.35s ease 0.05s, transform 0.35s ease 0.05s",
            }}
          >
            {slide.subtext}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12"
            style={{
              opacity: fading ? 0 : 1,
              transition: "opacity 0.35s ease 0.08s",
            }}
          >
            <Link
              href={slide.shopHref}
              className="btn-primary kg-shine text-base py-4 px-8 shadow-[0_12px_40px_-10px_rgba(214,62,10,0.8)]"
            >
              Shop {slide.name}
              <ArrowRight size={16} />
            </Link>
            <Link href="/shop" className="btn-outline-white text-base py-4 px-8">
              All Products
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            {[
              { value: "5K+", label: "Happy Customers" },
              { value: "50+", label: "Premium Cuts" },
              { value: "100%", label: "Quality Assured" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-4 sm:gap-6">
                {i > 0 && <div className="w-px h-8 bg-white/25" />}
                <div>
                  <div className="text-xl sm:text-2xl font-display font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-[11px] sm:text-xs text-white/60 tracking-wide mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-8 sm:pb-10">
          <div className="flex gap-2 sm:gap-3 flex-wrap mb-5 sm:mb-6">
            {heroSlides.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  goTo(index);
                  router.prefetch(s.shopHref);
                }}
                className={`group flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border transition-all duration-300 text-xs sm:text-sm font-semibold ${
                  current === index
                    ? "bg-white text-primary-text border-transparent shadow-soft"
                    : "bg-white/10 text-white/85 border-white/30 hover:bg-white/20 backdrop-blur-sm"
                }`}
              >
                {s.name}
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={current === index ? "true" : undefined}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: current === index ? "2.5rem" : "0.625rem",
                  background: current === index ? "white" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
