import Image from "next/image";

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
  image = "/images/hero/hero-chicken.jpg",
  imageAlt = "KG Foods premium products",
  label = "KG Foods",
}: PageHeroProps) {
  return (
    <section className="relative w-full min-h-[220px] sm:min-h-[50vh] lg:min-h-[55vh] overflow-hidden">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent z-10" />

      <div className="relative z-20 flex flex-col justify-end min-h-[220px] sm:min-h-[50vh] lg:min-h-[55vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-14 lg:pb-16 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2 sm:mb-4">
              <div className="w-8 h-px bg-accent" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase text-white/80">
                {label}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.08] mb-3 sm:mb-4">
              {title}
            </h1>
            <p className="text-sm sm:text-lg text-white/75 leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
