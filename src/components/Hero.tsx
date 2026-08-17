"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ArrowRight } from "lucide-react";

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

  const goTo = useCallback((index: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % heroSlides.length);
        setFading(false);
      }, 400);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Background images */}
      {heroSlides.map((s, index) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: current === index ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.name}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col min-h-screen px-4 sm:px-8 lg:px-16 xl:px-24">
        {/* Navbar spacer */}
        <div className="h-24" />

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-white/70" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-white/80">
              Farm to Your Table
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display text-white leading-[1.06] mb-5 transition-all duration-400"
            style={{
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(10px)" : "translateY(0)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {slide.headline[0]}
            <br />
            <span className="text-accent-light">{slide.headline[1]}</span>
          </h1>

          {/* Subtext */}
          <p
            className="text-white/80 text-lg leading-relaxed mb-10 max-w-md"
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(8px)" : "translateY(0)",
              transition: "opacity 0.4s ease 0.05s, transform 0.4s ease 0.05s",
            }}
          >
            {slide.subtext}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link
              href={slide.shopHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white font-semibold text-base rounded-full hover:bg-accent-light transition-colors duration-200"
            >
              Shop {slide.name}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold text-base rounded-full border border-white/30 hover:bg-white/20 transition-colors duration-200 backdrop-blur-sm"
            >
              All Products
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            {[
              { value: "5K+", label: "Happy Customers" },
              { value: "50+", label: "Premium Cuts" },
              { value: "100%", label: "Quality Assured" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-6">
                {i > 0 && <div className="w-px h-8 bg-white/25" />}
                <div>
                  <div className="text-2xl font-display font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/60 tracking-wide mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pb-10">
          {/* Category tabs */}
          <div className="flex gap-2 sm:gap-3 flex-wrap mb-6">
            {heroSlides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => {
                  goTo(index);
                  router.prefetch(s.shopHref);
                }}
                className="group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-sm font-semibold"
                style={{
                  background:
                    current === index
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.12)",
                  borderColor:
                    current === index ? "transparent" : "rgba(255,255,255,0.3)",
                  color:
                    current === index ? "#111111" : "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {s.name}
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: current === index ? "2.5rem" : "0.625rem",
                  background:
                    current === index ? "white" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}