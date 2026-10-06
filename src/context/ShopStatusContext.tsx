"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_HOURS, shopNow, type LiveShopStatus, type ManualStatus, type OpeningHours } from "@/lib/hours";

const OPEN: LiveShopStatus = { open: true, reason: "open", message: "", label: "", blockedLabel: "", closesAt: null, minutesToClose: null, opensLabel: null };
const ShopStatusContext = createContext<LiveShopStatus>(OPEN);

/**
 * Whether the shop is taking orders right now: the manual "pause orders" switch AND the opening hours.
 * The hours are checked against the clock in the browser and re-checked every 30 seconds, so the page
 * flips to the closed view at closing time without a reload. Until the browser knows the time, only the
 * manual switch counts (so the page never flashes "closed" for no reason).
 */
export function ShopStatusProvider({
  status,
  hours = DEFAULT_HOURS,
  children,
}: {
  status: ManualStatus;
  hours?: OpeningHours;
  children: ReactNode;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    const onShow = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);

  const value = useMemo<LiveShopStatus>(() => {
    if (now === null) {
      return status.open ? OPEN : shopNow(hours, status, Date.now());
    }
    return shopNow(hours, status, now);
  }, [status, hours, now]);

  return <ShopStatusContext.Provider value={value}>{children}</ShopStatusContext.Provider>;
}

export const useShopStatus = () => useContext(ShopStatusContext);
