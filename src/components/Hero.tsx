"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useShopStatus } from "@/context/ShopStatusContext";

const INTERVAL = 8000;

const heroSlides = [
  {
    id: "chicken",
    name: "Chicken",
    headline: ["Farm-Fresh", "Chicken"],
    subtext:
      "Antibiotic-free, farm-raised chicken — cleaned, cut, and delivered to your door within 24 hours.",
    image: "/images/hero/hero-chicken.jpg",
    shopHref: "/shop?category=Chicken",
  },
  {
    id: "mutton",
    name: "Mutton",
    headline: ["Premium", "Mutton Cuts"],
    subtext:
      "Tender, grain-fed mutton — hand-selected by our butchers for flavour, texture, and freshness.",
    image: "/images/hero/hero-mutton.png",
    shopHref: "/shop?category=Mutton",
  },
  {
    id: "eggs",
    name: "Eggs",
    headline: ["Free-Range", "Farm Eggs"],
    subtext:
      "Rich, golden-yolk eggs from free-range hens — naturally raised and delivered fresh every morning.",
    image: "/images/hero/hero-eggs.jpg",
    shopHref: "/shop?category=Eggs",
  },
  {
    id: "ready-to-cook",
    name: "Ready-to-Cook",
    headline: ["Ready-to-Cook", "Meals"],
    subtext:
      "Marinated, seasoned, and oven-ready — restaurant-quality meals on your table in under 30 minutes.",
    image: "/images/hero/hero-ready-to-cook.jpg",
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
      className="relative w-full min-h-[85vh] lg:min-h-screen overflow-hidden"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
      }}
    >
      {heroSlides.map((s, index) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: current === index ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.name}
            fill
            priority={index === 0}
            className={`object-cover ${current === index ? "kg-kenburns" : ""}`}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Warm, lighter overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/5 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent z-10" />
      <div aria-hidden className="absolute inset-0 z-10 bg-[radial-gradient(60%_50%_at_90%_0%,rgba(255,170,90,0.22),transparent)]" />

      {/* Arrow navigation */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
      >
        <ChevronRight size={22} />
      </button>

      <div className="relative z-20 flex flex-col min-h-[85vh] lg:min-h-screen px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="h-2 sm:h-4" />

        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          <span className="kg-rise mb-4 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md sm:text-sm">
            <span className="kg-live-dot" aria-hidden="true" />
            {shop.extended ? `Open late · taking orders until ${shop.closesAt}` : shop.closesAt ? `Open now · taking orders until ${shop.closesAt}` : "Open now · taking orders"}
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
            <span className="text-accent-light">{slide.headline[1]}</span>
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
            <Link href={slide.shopHref} className="btn-primary kg-shine text-base py-4 px-8 shadow-[0_12px_40px_-10px_rgba(214,62,10,0.8)]">
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
