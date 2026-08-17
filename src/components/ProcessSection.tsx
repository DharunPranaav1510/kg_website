import { Sprout, ScanSearch, Scissors, Package, Bike } from "lucide-react";

const steps = [
  {
    icon: Sprout,
    step: "01",
    title: "Farm",
    description:
      "We partner with small, responsible farms that raise their birds and animals on natural feed — no hormones, no shortcuts.",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "Selection",
    description:
      "Every animal is carefully inspected for health and quality before it enters our processing chain. Anything below standard is rejected.",
  },
  {
    icon: Scissors,
    step: "03",
    title: "Processing",
    description:
      "Expert butchers work in chilled, hygienic facilities. Each cut is made with precision to ensure consistency and minimal waste.",
  },
  {
    icon: Package,
    step: "04",
    title: "Packaging",
    description:
      "Products are vacuum-sealed and packed in food-grade, tamper-evident packaging immediately after processing to lock in freshness.",
  },
  {
    icon: Bike,
    step: "05",
    title: "Delivery",
    description:
      "Cold-chain logistics ensure your order arrives at the right temperature, every single time — from our facility to your door.",
  },
];

export default function ProcessSection({ id }: { id?: string }) {
  return (
    <section id={id} className="py-16 sm:py-24 bg-[#111111] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4 block">
            From Source to Plate
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white mb-5">
            Our Promise,
            <br />
            Step by Step
          </h2>
          <p className="text-white/60 leading-relaxed">
            Transparency isn&apos;t a buzzword for us. Here&apos;s exactly how your order
            goes from a living farm to your kitchen — nothing hidden.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-white/10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center lg:items-start lg:text-left group"
              >
                {/* Icon + Step number */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-accent/20 group-hover:border-accent/40">
                    <step.icon
                      size={28}
                      className="text-white/60 transition-colors duration-300 group-hover:text-accent"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{step.step}</span>
                  </div>
                </div>

                <h3 className="font-display text-xl text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-16 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm text-center sm:text-left">
            Every order is handled by people who care — not an automated line.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-white/60 text-sm">Processing orders now</span>
          </div>
        </div>
      </div>
    </section>
  );
}
