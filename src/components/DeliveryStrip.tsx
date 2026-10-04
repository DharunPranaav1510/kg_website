"use client";

import { MapPin, Clock, Lock } from "lucide-react";
import { business } from "@/data/business";
import { useShopStatus } from "@/context/ShopStatusContext";

export default function DeliveryStrip() {
  const shop = useShopStatus();
  return (
    <div className="bg-cream border-b border-warm-gray pt-16 sm:pt-[4.5rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-x-4 sm:gap-x-8 gap-y-1 flex-wrap text-xs sm:text-sm text-secondary-text">
        {!shop.open ? (
          <span className="flex items-center gap-2 font-semibold text-accent">
            <Lock size={14} className="flex-shrink-0" />
            Orders paused{shop.message ? ` — ${shop.message}` : ""}
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin size={14} className="text-accent flex-shrink-0" />
              Delivering across {business.address.city}
            </span>
            <span className="hidden sm:block w-px h-3.5 bg-warm-gray" />
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-accent flex-shrink-0" />
              <span className="hidden sm:inline">Open </span>
              {business.hours.display}
              <span className="hidden sm:inline">, {business.hours.days}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
