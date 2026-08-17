import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/testimonials";

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

export default function Testimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={t.id}
              className={`card-base p-7 flex flex-col ${
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
              <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-accent bg-accent/8 rounded-full px-3 py-1.5 self-start mb-6">
                {t.product}
              </div>

              {/* Reviewer */}
              <div className="flex items-center gap-3 pt-5 border-t border-warm-gray">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-warm-gray flex-shrink-0">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary-text">{t.name}</div>
                  <div className="text-xs text-secondary-text mt-0.5">
                    {t.role} · {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-8 h-8 rounded-full bg-warm-gray border-2 border-white overflow-hidden"
                >
                  <div className="w-full h-full bg-gradient-to-br from-warm-gray to-cream" />
                </div>
              ))}
            </div>
            <div className="text-sm text-secondary-text">
              <span className="font-semibold text-primary-text">10,000+</span> happy customers
            </div>
          </div>
          <div className="w-px h-6 bg-warm-gray hidden sm:block" />
          <div className="flex items-center gap-2">
            <StarRating rating={5} />
            <span className="text-sm text-secondary-text">
              <span className="font-semibold text-primary-text">4.9/5</span> average rating
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
