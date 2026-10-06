"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Check, Loader2, LocateFixed, MapPin } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { reverseGeocode } from "@/lib/geocode";
import { distanceKm } from "@/lib/pricing";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background text-sm text-secondary-text">
      <Loader2 size={18} className="mr-2 animate-spin" /> Opening the map…
    </div>
  ),
});

export interface FoundLocation {
  lat: number;
  lng: number;
  street?: string;
  area?: string;
  pincode?: string;
}

/**
 * The customer's delivery pin: use the phone's location, or place it on a map.
 * When the shop delivers within a radius, the pin is required and checked here and on the server.
 */
export default function LocationButton({
  pinned,
  required,
  error,
  onFound,
  onClear,
}: {
  pinned: { lat: number; lng: number } | null;
  required: boolean;
  error?: string;
  onFound: (loc: FoundLocation) => void;
  onClear: () => void;
}) {
  const { maps, delivery } = useBusiness();
  const [state, setState] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const radius = delivery.radiusKm;

  const km = pinned ? distanceKm(pinned, maps) : 0;
  const outside = !!pinned && radius > 0 && km > radius;

  async function accept(lat: number, lng: number) {
    const place = await reverseGeocode(lat, lng);
    onFound({ lat, lng, ...place });
    setState("idle");
    setMessage("Location pinned. We filled in what we could. Please check the details below and add your house number.");
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setState("error");
      setMessage("Your browser can't share location. Choose it on the map instead.");
      return;
    }
    setState("locating");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => accept(coords.latitude, coords.longitude),
      (err) => {
        setState("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Choose it on the map instead."
            : "We couldn't get your location. Choose it on the map instead."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  return (
    <div id="ck-location" tabIndex={-1}>
      {pinned ? (
        <div className={`rounded-xl border p-3.5 ${outside ? "border-accent/40 bg-accent/5" : "border-success/40 bg-success/10"}`}>
          <p className={`flex items-start gap-2 text-sm font-medium ${outside ? "text-accent" : "text-success"}`}>
            <Check size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              Location pinned · about {km.toFixed(1)} km from the shop
              {radius > 0 && (outside ? `. This is outside our ${radius} km delivery area.` : ". Inside our delivery area.")}
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setMapOpen(true)} className="min-h-11 flex-1 rounded-full border border-warm-gray bg-white text-sm font-medium">Change on map</button>
            <button type="button" onClick={onClear} className="min-h-11 rounded-full border border-warm-gray bg-white px-5 text-sm text-secondary-text">Remove</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={state === "locating"}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            {state === "locating" ? <><Loader2 size={16} className="animate-spin" /> Finding you…</> : <><LocateFixed size={16} /> Use my location</>}
          </button>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-accent bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            <MapPin size={16} /> Choose on map
          </button>
        </div>
      )}
      {required && !pinned && <p className="mt-2 text-xs text-secondary-text">Pinning your location is needed so we can check we deliver to you{radius > 0 ? ` (we deliver within ${radius} km of the shop)` : ""}.</p>}
      {message && <p className={`mt-2 text-xs ${state === "error" ? "text-accent" : "text-secondary-text"}`}>{message}</p>}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-accent">{error}</p>}

      {mapOpen && (
        <MapPicker
          shop={{ lat: maps.lat, lng: maps.lng }}
          radiusKm={radius}
          initial={pinned}
          onClose={() => setMapOpen(false)}
          onConfirm={(p) => {
            setMapOpen(false);
            void accept(p.lat, p.lng);
          }}
        />
      )}
    </div>
  );
}
