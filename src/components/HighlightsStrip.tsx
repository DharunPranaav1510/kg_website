import { BadgeCheck } from "lucide-react";
import { getBusiness } from "@/lib/content";

/** Short promises set in Admin > Website content > Business details (for example "100% Halal"). */
export default async function HighlightsStrip() {
  const { highlights } = await getBusiness();
  if (!highlights.length) return null;
  return (
    <section aria-label="Highlights" className="bg-cream border-b border-warm-gray">
      <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-sm font-semibold text-primary-text">
            <BadgeCheck size={18} className="text-success" strokeWidth={2} />
            {h}
          </li>
        ))}
      </ul>
    </section>
  );
}
