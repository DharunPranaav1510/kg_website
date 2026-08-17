import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { heroCategories } from "@/data/heroCategories";

export default function HeroCategories() {
  return (
    <div className="relative z-10 -mt-2 lg:-mt-10 pb-10 lg:pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm font-medium text-secondary-text mb-4 sm:mb-6">
          Shop by category — fresh, hygienic, delivered daily
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {heroCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 aspect-[4/3] sm:aspect-[5/4]"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                <h3 className="font-display text-base sm:text-lg lg:text-xl text-white leading-tight">
                  {cat.name}
                </h3>
                <p className="text-white/65 text-xs sm:text-sm mt-0.5 hidden sm:block">
                  {cat.description}
                </p>
                <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium mt-2 group-hover:text-white group-hover:gap-2 transition-all">
                  Shop Now
                  <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
