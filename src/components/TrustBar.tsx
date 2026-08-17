import { Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";

const trustItems = [
  {
    icon: Leaf,
    label: "Fresh Daily",
    description: "Sourced and delivered every morning",
  },
  {
    icon: ShieldCheck,
    label: "Quality Checked",
    description: "Every batch inspected by our team",
  },
  {
    icon: Sparkles,
    label: "Hygienic Processing",
    description: "FSSAI certified clean facilities",
  },
  {
    icon: Truck,
    label: "Fast Delivery",
    description: "Cold-chain delivery to your door",
  },
];

export default function TrustBar() {
  return (
    <section className="bg-white border-y border-warm-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-warm-gray">
          {trustItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 px-6 py-7 group"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/8 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-accent/12">
                <item.icon
                  size={20}
                  className="text-accent"
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <div className="font-semibold text-sm text-primary-text">
                  {item.label}
                </div>
                <div className="text-xs text-secondary-text mt-0.5 leading-snug">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
