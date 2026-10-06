"use client";

import { useShopStatus } from "@/context/ShopStatusContext";

export default function ShopChip() {
  const shop = useShopStatus();
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${shop.open ? "bg-white/15 text-white" : "bg-accent text-white"}`}>
      <span className="relative flex h-2 w-2">
        {shop.open && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 motion-safe:animate-ping" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${shop.open ? "bg-emerald-400" : "bg-white"}`} />
      </span>
      {shop.open ? (shop.closesAt ? `Taking orders · until ${shop.closesAt}` : "Taking orders now") : shop.label}
    </span>
  );
}
