import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, FlaskConical, Award, Truck, Phone } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { business } from "@/data/business";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import ProcessSection from "@/components/ProcessSection";

export const metadata = createPageMetadata({
  title: "About Us",
  description:
    "Learn about KG Meat Mart — Hosur's trusted source for farm-fresh chicken, mutton, eggs, and ready-to-cook products since 2018.",
  path: "/about",
  ogImage: "/images/about/about-company.jpg",
});

const whyChooseUs = [
  {
    icon: Leaf,
    title: "Farm Fresh Products",
    description:
      "Sourced directly from Tamil Nadu farms and delivered within 24 hours of processing.",
  },
  {
    icon: FlaskConical,
    title: "Strict Hygiene Standards",
    description:
      "Our facility follows strict hygiene standards with daily sanitation audits and temperature-controlled processing.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description:
      "Every batch is inspected by our quality team before cold-chain dispatch to your door.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Same-day delivery across Hosur and surrounding areas.",
  },
];

const stats = [
  { value: "5000+", label: "Happy Customers" },
  { value: "100%",  label: "Quality Checked" },
  { value: "25+",   label: "Products" },
  { value: "365",   label: "Days Freshness Commitment" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          title="About KG Meat Mart"
          subtitle="Since 2018, we've been delivering fresh, hygienic chicken, mutton, eggs, and ready-to-cook products to families across Hosur."
          image="/images/about/about-company.jpg"
          imageAlt="Fresh meat and poultry at KG Meat Mart Hosur"
          label="Our Story"
        />

        {/* Story section */}
        <section className="py-16 sm:py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 xl:gap-24 items-center">

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-card">
                  <Image
                    src="/images/about/about-company.jpg"
                    alt="KG Meat Mart — fresh products in Hosur"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                {/* Floating stat card */}
                <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white rounded-2xl shadow-hover px-5 py-4 border border-warm-gray">
                  <div className="font-display text-3xl font-bold text-primary-text">5000+</div>
                  <div className="text-xs text-secondary-text mt-0.5 tracking-wide">Happy Customers</div>
                </div>
              </div>

              <div>
                <span className="section-label block mb-4">Our Story</span>
                <h2 className="section-title mb-6">Welcome to {business.name}</h2>
                <p className="section-subtitle mb-6">
                  {business.name} was founded in 2018 with a simple belief: every family
                  in Hosur deserves access to clean, honestly-processed meat — not mystery
                  packages from a cold shelf.
                </p>
                <p className="text-secondary-text leading-relaxed mb-4">
                  From our processing facility in Hosur, we process farm-fresh poultry,
                  premium mutton, free-range eggs, and ready-to-cook products daily. We work
                  directly with local farms, cutting out middlemen to bring you better quality
                  at fair prices.
                </p>
                <p className="text-secondary-text leading-relaxed mb-8">
                  Today, we serve over 5,000 families across Hosur with same-day cold-chain
                  delivery and a 100% freshness guarantee on every order.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent-light transition-colors"
                >
                  Browse Our Products <ArrowRight size={15} />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 sm:py-20 md:py-28 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
              <span className="section-label block mb-3">What Drives Us</span>
              <h2 className="section-title">Mission &amp; Vision</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              <div className="card-base p-8 sm:p-10">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4 block">
                  Our Mission
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-primary-text mb-4">
                  Quality You Can Trust
                </h3>
                <p className="text-secondary-text leading-relaxed">
                  To provide fresh, safe, and high-quality meat products that families
                  can trust — every day, every order.
                </p>
              </div>

              <div className="card-base p-8 sm:p-10 bg-[#111111] text-white border-0">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4 block">
                  Our Vision
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-white mb-4">
                  Hosur&apos;s Most Trusted Meat Brand
                </h3>
                <p className="text-white/60 leading-relaxed">
                  To become the most trusted premium meat and poultry brand in Tamil Nadu,
                  known for transparency, hygiene, and consistent quality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 sm:py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
              <span className="section-label block mb-3">Why Choose Us</span>
              <h2 className="section-title">The {business.shortName} Standard</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {whyChooseUs.map((item) => (
                <div key={item.title} className="card-base p-6 sm:p-7 group">
                  <div className="w-12 h-12 rounded-xl bg-accent/8 flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-accent/15">
                    <item.icon size={22} className="text-accent" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-base text-primary-text mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-secondary-text leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ProcessSection id="process" />

        {/* Stats */}
        <section className="py-16 sm:py-20 md:py-28 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-6 sm:p-10 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/30 transition-colors duration-300"
                >
                  <div className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-white/50 tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-[#111111] rounded-3xl overflow-hidden px-6 sm:px-8 py-14 sm:py-20 md:px-16 text-center">
              <div className="relative z-10">
                <span className="section-label block mb-4 text-white/50">
                  Ready to Order?
                </span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-8">
                  Experience Premium Quality Today
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white font-semibold text-base rounded-full hover:bg-accent-light transition-colors"
                  >
                    Shop Products <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold text-base rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <Phone size={16} /> Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}