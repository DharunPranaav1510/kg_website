import { MapPin, Clock } from "lucide-react";
import { business } from "@/data/business";

export default function DeliveryStrip() {
  return (
    <div className="bg-cream border-b border-warm-gray pt-16 sm:pt-[4.5rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-xs sm:text-sm text-secondary-text">
        <span className="flex items-center gap-2 font-medium">
          <MapPin size={14} className="text-accent flex-shrink-0" />
          Delivering across {business.address.city} &amp; nearby areas
        </span>
        <span className="hidden sm:block w-px h-3.5 bg-warm-gray" />
        <span className="flex items-center gap-2">
          <Clock size={14} className="text-accent flex-shrink-0" />
          Open {business.hours.display}, {business.hours.days}
        </span>
      </div>
    </div>
  );
}
