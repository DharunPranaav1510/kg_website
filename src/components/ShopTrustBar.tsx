import { Leaf, Snowflake, BadgeCheck } from "lucide-react";

const items = [
  { icon: Leaf, label: "Sourced Daily", color: "text-success" },
  { icon: Snowflake, label: "Cold-chain Delivery", color: "text-accent" },
  { icon: BadgeCheck, label: "FSSAI Certified", color: "text-accent" },
];

export default function ShopTrustBar() {
  return (
    <section className="border-y border-warm-gray bg-white mt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 sm:divide-x sm:divide-warm-gray">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 sm:px-10 first:sm:pl-0 last:sm:pr-0"
            >
              <item.icon size={16} className={item.color} strokeWidth={2} />
              <span className="text-xs sm:text-sm text-secondary-text font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
