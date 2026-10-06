"use client";

import { Lock, Moon } from "lucide-react";
import { useShopStatus } from "@/context/ShopStatusContext";

/** The one place that words "we are not taking orders". Paused by the admin vs closed for the day. */
export function closedHeadline(reason: string) {
  return reason === "paused" ? "Orders are paused." : "We're closed right now.";
}

export default function ClosedNotice({ className = "" }: { className?: string }) {
  const shop = useShopStatus();
  if (shop.open) return null;
  const Icon = shop.reason === "paused" ? Lock : Moon;
  return (
    <p role="status" className={`flex items-start gap-2 ${className}`}>
      <Icon size={14} className="mt-0.5 flex-shrink-0" />
      <span><b>{closedHeadline(shop.reason)}</b> {shop.message}</span>
    </p>
  );
}
