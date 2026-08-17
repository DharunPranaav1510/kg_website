import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { categories } from "@/data/categories";

export default function Categories() {
  const [featured, ...rest] = categories;

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
          <div>
            <span className="section-label block mb-3">What We Offer</span>
            <h2 className="section-title">
              Shop By <br className="hidden sm:block" />
              Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm font-medium text-accent hover:gap-3 transition-all duration-200"
          >
            View All Products
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Featured large card */}
          <Link
            href={featured.href}
            className="col-span-12 md:col-span-6 relative rounded-2xl overflow-hidden group aspect-[4/3] md:aspect-auto md:row-span-2 block"
            style={{ minHeight: "420px" }}
          >
            <Image
              src={featured.image}
              alt={featured.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/60 mb-2 block">
                {featured.itemCount}
              </span>
              <h3 className="font-display text-3xl text-white mb-1">
                {featured.name}
              </h3>
              <p className="text-white/70 text-sm mb-4">{featured.description}</p>
              <div className="flex items-center gap-2 text-white text-sm font-medium group-hover:gap-3 transition-all">
                Shop {featured.name}
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Smaller cards */}
          {rest.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="col-span-6 md:col-span-3 relative rounded-2xl overflow-hidden group aspect-square block"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/55 block mb-1">
                  {cat.itemCount}
                </span>
                <h3 className="font-display text-lg text-white leading-tight">
                  {cat.name}
                </h3>
                <div className="flex items-center gap-1.5 text-white/70 text-xs mt-1.5 group-hover:text-white group-hover:gap-2 transition-all">
                  Shop Now
                  <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
