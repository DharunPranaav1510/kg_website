"use client";

import { useMemo } from "react";
import { useBusiness } from "@/context/BusinessContext";
import type { Product } from "@/data/products";
import { allowedWeightsFor, defaultWeight, gstRateFor, offerActive, percentOff, effectivePrice } from "@/lib/pricing";

/** Everything a product card needs to show: price, offer, GST note, allowed quantities. */
export function useProductPricing(product: Product) {
  const tax = useBusiness().tax;
  return useMemo(() => {
    const now = Date.now();
    const allowed = allowedWeightsFor(product);
    const price = effectivePrice(product, now);
    const onOffer = offerActive(product, now);
    const gstRate = gstRateFor(product, tax);

    // Up to three quick-add choices: prefer 1/2, 1 and 2, else the first few allowed quantities.
    const preferred = (product.isEgg ? [1, 2, 0.5] : [0.5, 1, 2]).filter((w) => allowed.includes(w));
    const quick = (allowed.length <= 4 ? allowed : preferred.length >= 2 ? preferred.sort((a, b) => a - b) : allowed.slice(0, 3)).slice(0, 4);

    return {
      allowed,
      quick,
      first: defaultWeight(product),
      price,
      listPrice: product.pricePerKg,
      onOffer,
      off: percentOff(product, now),
      offerLabel: product.offer?.label || (onOffer ? "Offer" : ""),
      gstRate,
      gstNote: gstRate > 0 ? (tax.inclusive ? `incl. ${gstRate}% GST` : `+ ${gstRate}% GST`) : "",
      priceFor: (w: number) => Math.round(price * w),
    };
  }, [product, tax]);
}
