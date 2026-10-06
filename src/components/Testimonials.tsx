import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { getTestimonials } from "@/lib/content";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? "text-amber-400 fill-amber-400" : "text-warm-gray fill-warm-gray"}
        />
      ))}
    </div>
  );
}

export default async function Testimonials() {
  const testimonials = await getTestimonials();
  if (!testimonials.length) return null;
  const average = testimonials.reduce((n, t) => n + t.rating, 0) / testimonials.length;
  return (
    <section className="py-16 sm:py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-16">
          <span className="section-label block mb-3">Real Reviews</span>
          <h2 className="section-title mb-4">
            What Our Customers Say
          </h2>
          <p className="section-subtitle">
            Don&apos;t take our word for it — here&apos;s what families, chefs, and home cooks
            across Tamil Nadu are saying.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t, idx) => (
            <div
              key={t.id}
              className={`card-base p-5 sm:p-7 flex flex-col w-[85%] flex-shrink-0 snap-center md:w-auto md:flex-shrink ${
                idx === 1 ? "md:translate-y-4" : ""
              }`}
            >
              {/* Quote icon */}
              <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mb-6">
                <Quote size={18} className="text-accent" strokeWidth={1.75} />
              </div>

              {/* Rating */}
              <StarRating rating={t.rating} />

              {/* Quote */}
              <blockquote className="text-[15px] text-secondary-text leading-relaxed mt-4 mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Product tag */}
              {t.product && (
                <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-accent bg-accent/8 rounded-full px-3 py-1.5 self-start mb-6">
                  {t.product}
                </div>
              )}

              {/* Reviewer */}
              <div className="flex items-center gap-3 pt-5 border-t border-warm-gray">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-warm-gray flex-shrink-0">
                  {t.image ? (
                    <Image src={t.image} alt={t.name} fill className="object-cover" sizes="44px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-accent/10 text-sm font-semibold text-accent">
                      {t.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary-text">{t.name}</div>
                  <div className="text-xs text-secondary-text mt-0.5">
                        {[t.role, t.location].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary: worked out from the reviews shown above, never typed in by hand */}
        <div className="mt-6 sm:mt-12 flex items-center justify-center gap-3 text-center">
          <StarRating rating={Math.round(average)} />
          <span className="text-sm text-secondary-text">
            <span className="font-semibold text-primary-text">{average.toFixed(1)}/5</span> from {testimonials.length}{" "}
            {testimonials.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>
    </section>
  );
}
