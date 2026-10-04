"use client";

import { useState } from "react";
import { Check, LocateFixed, Loader2 } from "lucide-react";

export interface FoundLocation {
  lat: number;
  lng: number;
  street?: string;
  area?: string;
  pincode?: string;
}

// Asks the browser for the customer's position and (best effort) turns it into
// street / area / pincode using OpenStreetMap's free reverse-geocoding.
export default function LocationButton({
  pinned,
  onFound,
  onClear,
}: {
  pinned: boolean;
  onFound: (loc: FoundLocation) => void;
  onClear: () => void;
}) {
  const [state, setState] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState("");

  function locate() {
    if (!("geolocation" in navigator)) {
      setState("error");
      setMessage("Your browser can't share location. Please type your address.");
      return;
    }
    setState("locating");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const loc: FoundLocation = { lat: coords.latitude, lng: coords.longitude };
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          if (res.ok) {
            const a = (await res.json()).address ?? {};
            loc.street = a.road || a.pedestrian || a.residential || undefined;
            loc.area = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.village || undefined;
            loc.pincode = /^\d{6}$/.test(a.postcode ?? "") ? a.postcode : undefined;
          }
        } catch {
          /* the pin alone is still useful for delivery */
        }
        onFound(loc);
        setState("idle");
        setMessage("Location pinned. We filled in what we could. Please check the details below and add your house number.");
      },
      (err) => {
        setState("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. You can still type your address below."
            : "We couldn't get your location. Please type your address below."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={pinned ? onClear : locate}
        disabled={state === "locating"}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
          pinned
            ? "border-success/40 bg-success/10 text-success"
            : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/10"
        }`}
      >
        {state === "locating" ? (
          <><Loader2 size={16} className="animate-spin" /> Finding you…</>
        ) : pinned ? (
          <><Check size={16} /> Location pinned · tap to remove</>
        ) : (
          <><LocateFixed size={16} /> Use my current location</>
        )}
      </button>
      {message && (
        <p className={`mt-2 text-xs ${state === "error" ? "text-accent" : "text-secondary-text"}`}>{message}</p>
      )}
    </div>
  );
}
