"use client";

import { useEffect, useState } from "react";
import { useShopStatus } from "@/context/ShopStatusContext";

/** "9 h 24 min" until the shop opens, ticking along while the page is open. */
export function useOpensIn(): string | null {
  const shop = useShopStatus();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);
  if (now === null || !shop.opensAt || shop.opensAt <= now) return null;
  const mins = Math.max(1, Math.round((shop.opensAt - now) / 60000));
  const h = Math.floor(mins / 60);
  if (h >= 48) return `${Math.floor(h / 24)} days`;
  return h > 0 ? `${h} h ${String(mins % 60).padStart(2, "0")} min` : `${mins} min`;
}

export default function OpensIn({ className = "" }: { className?: string }) {
  const left = useOpensIn();
  if (!left) return null;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-sm font-semibold text-amber-100 ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300" />
      </span>
      Opens in {left}
    </span>
  );
}
