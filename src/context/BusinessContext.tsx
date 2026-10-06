"use client";

import { createContext, useContext } from "react";
import { business as defaults } from "@/data/business";
import { mergeBusiness, type Business } from "@/lib/content-schema";

const BusinessContext = createContext<Business | null>(null);

/** The business details (phone, hours, delivery rules ...) as currently set in the admin panel. */
export function BusinessProvider({ business, children }: { business: Business; children: React.ReactNode }) {
  return <BusinessContext.Provider value={business}>{children}</BusinessContext.Provider>;
}

export function useBusiness(): Business {
  return useContext(BusinessContext) ?? mergeBusiness(null) ?? (defaults as unknown as Business);
}
