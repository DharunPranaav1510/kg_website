"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShopStatus } from "@/lib/settings";

const ShopStatusContext = createContext<ShopStatus>({ open: true, message: "" });

export function ShopStatusProvider({ status, children }: { status: ShopStatus; children: ReactNode }) {
  return <ShopStatusContext.Provider value={status}>{children}</ShopStatusContext.Provider>;
}

export const useShopStatus = () => useContext(ShopStatusContext);
