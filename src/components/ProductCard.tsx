"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";

const badgeColors: Record<string, string> = {
  Bestseller: "bg-amber-100 text-amber-800",
  New:        "bg-success/10 text-success",
  Popular:    "bg-accent/10 text-accent",
  Premium:    "bg-accent/10 text-accent",
};

const categoryBorder: Record<string, string> = {
  Chicken:           "border-t-[3px] border-t-orange-400",
  Mutton:            "border-t-[3px] border-t-amber-800",
  Eggs:              "border-t-[3px] border-t-yellow-400",
  "Frozen Products": "border-t-[3px] border-t-sky-400",
  "Ready To Cook":   "border-t-[3px] border-t-accent",
};

const EGG_OPTIONS = [
  { label: "½ Dozen", value: 0.5 },
  { label: "1 Dozen", value: 1 },
  { label: "2 Dozen", value: 2 },
];

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, updateWeight, getWeight } = useCart();
  const [picking, setPicking] = useState(false);
  const [draftWeight, setDraftWeight] = useState(0.5);

  const cartWeight = getWeight(product.id);
  const inCart = cartWeight > 0;
  const priceFor = (w: number) => Math.round(product.pricePerKg * w);

  const openPicker = () => {
    setDraftWeight(inCart ? cartWeight : product.isEgg ? 1 : 0.5);
    setPicking(true);
  };

  const confirmAdd = () => {
    if (inCart) { updateWeight(product.id, draftWeight); }
    else { addItem(product.id, draftWeight); }
    setPicking(false);
  };

  return (
    <div className={`card-base group flex flex-col ${categoryBorder[product.category] ?? ""}`}>
      <div className="p-4 sm:p-5 flex flex-col flex-1">

        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-secondary-text tracking-wide uppercase">
              {product.category}
            </span>
            <h3 className="font-display text-base sm:text-lg text-primary-text mt-0.5 leading-tight">
              {product.name}
            </h3>
            {product.badge && (
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${badgeColors[product.badge] ?? "bg-white/90 text-primary-text"}`}>
                {product.badge}
              </span>
            )}
          </div>
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-warm-gray flex-shrink-0">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
          </div>
        </div>

        <p className="text-sm text-secondary-text mb-4 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        <div className="mb-4">
          <span className="text-xs text-secondary-text">
            {product.isEgg ? `₹${product.pricePerKg}/dozen` : `₹${product.pricePerKg}/kg`}
          </span>
          {inCart && !picking && (
            <div className="text-lg font-bold text-primary-text mt-0.5">
              ₹{priceFor(cartWeight)}
              <span className="text-sm font-normal text-secondary-text ml-2">
                {product.isEgg ? `${cartWeight === 0.5 ? "½" : cartWeight} dozen` : `${cartWeight} kg`}
              </span>
            </div>
          )}
        </div>

        {picking && (
          <div className="mb-4 p-3 bg-cream rounded-2xl border border-warm-gray">
            {product.isEgg ? (
              <div className="flex gap-2 mb-3">
                {EGG_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setDraftWeight(opt.value)}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-all ${
                      draftWeight === opt.value
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-primary-text border-warm-gray hover:border-accent/40"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-secondary-text">Weight</span>
                  <span className="font-semibold text-primary-text">{draftWeight} kg</span>
                </div>
                <input type="range" min={0.25} max={3} step={0.25} value={draftWeight}
                  onChange={(e) => setDraftWeight(Number(e.target.value))}
                  className="w-full accent-accent mb-2" />
                <div className="flex justify-between text-xs text-secondary-text">
                  <span>0.25 kg</span><span>3 kg</span>
                </div>
              </>
            )}
            <div className="text-center mt-3 mb-3">
              <span className="text-2xl font-bold text-primary-text">₹{priceFor(draftWeight)}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={confirmAdd}
                className="flex-1 py-2.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent-light transition-colors">
                {inCart ? "Update" : "Add to Cart"}
              </button>
              <button type="button" onClick={() => setPicking(false)}
                className="px-4 py-2.5 text-sm text-secondary-text border border-warm-gray rounded-full hover:border-accent/40 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {!picking && (
          <div className="mt-auto flex items-center justify-between gap-2">
            {inCart ? (
              <>
                <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                  <Check size={15} />In cart
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={openPicker}
                    className="px-3 py-2 text-sm font-medium rounded-full border border-warm-gray hover:border-accent/40 text-primary-text transition-colors">
                    Edit
                  </button>
                  <button type="button" onClick={() => updateWeight(product.id, 0)}
                    className="px-3 py-2 text-sm text-secondary-text rounded-full border border-warm-gray hover:text-accent hover:border-accent/40 transition-colors">
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button type="button" onClick={openPicker}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent-light transition-all hover:shadow-glow active:scale-95 ml-auto">
                <ShoppingCart size={14} strokeWidth={1.75} />Add to Cart
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
