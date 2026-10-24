import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";

/**
 * A product photo, or a quiet placeholder while a product has no photo yet.
 * (next/image refuses an empty src, so every product picture goes through here.)
 */
export default function ProductImage({ src, alt, sizes, className = "" }: { src?: string | null; alt: string; sizes: string; className?: string }) {
  if (!src) {
    return (
      <span role="img" aria-label={alt} className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-cream to-warm-gray text-secondary-text/60 ${className.includes("grayscale") ? "opacity-60" : ""}`}>
        <UtensilsCrossed size={26} strokeWidth={1.5} aria-hidden="true" />
        <span className="px-2 text-center text-[10px] font-medium uppercase tracking-wider">Photo coming soon</span>
      </span>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />;
}
