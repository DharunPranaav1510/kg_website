import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#111111] rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #8B1E1E 0%, transparent 60%),
                                radial-gradient(circle at 80% 50%, #2F6B45 0%, transparent 60%)`,
            }}
          />
          {/* Dotted texture */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-6 h-px bg-accent" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/50">
                Join 10,000+ happy customers
              </span>
              <div className="w-6 h-px bg-accent" />
            </div>

            {/* Headline */}
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-5 leading-tight">
              Ready To Experience
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-red-100">
                Freshness?
              </span>
            </h2>

            {/* Sub */}
            <p className="text-white/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Order before noon and get same-day delivery in select areas. Your first
              order gets free cold-pack delivery.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop" className="btn-primary text-base py-4 px-10">
                Shop Products
                <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="btn-outline-white text-base py-4 px-10">
                <Phone size={16} />
                Contact Us
              </Link>
            </div>

            {/* Disclaimer */}
            <p className="text-white/30 text-xs mt-8">
              Free delivery on first order · No minimum order value · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
