import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface PageHeroProps {
  title: string;
  subtitle: string;
  image?: string;
  imageAlt?: string;
  label?: string;
}

export default function PageHero({
  title,
  subtitle,
  image = "/images/hero/hero-main.jpg",
  imageAlt = "KG Foods premium products",
  label = "KG Foods",
}: PageHeroProps) {
  return (
    <section className="relative w-full min-h-[60vh] lg:min-h-[70vh] overflow-hidden pt-16 sm:pt-18">
      {/* Full-bleed background image */}
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-end min-h-[60vh] lg:min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-8 h-px bg-accent" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase text-accent/90">
                {label}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white leading-[1.08] mb-4 sm:mb-5">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-lg">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHeroCta({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:gap-3 transition-all duration-200 mt-6"
    >
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}