"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, LocateFixed, Loader2, X } from "lucide-react";
import { distanceKm } from "@/lib/pricing";

export interface PickedLocation {
  lat: number;
  lng: number;
}

/**
 * Full-screen map. The pin stays in the middle and the customer moves the map under it, which is
 * much easier with a thumb than dragging a tiny marker. The delivery circle is drawn around the shop.
 */
export default function MapPicker({
  shop,
  radiusKm,
  initial,
  onConfirm,
  onClose,
}: {
  shop: PickedLocation;
  radiusKm: number;
  initial: PickedLocation | null;
  onConfirm: (p: PickedLocation) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [center, setCenter] = useState<PickedLocation>(initial ?? shop);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!box.current) return;
    const start = initial ?? shop;
    const map = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([start.lat, start.lng], radiusKm > 0 && !initial ? 13 : 16);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    if (radiusKm > 0) {
      L.circle([shop.lat, shop.lng], { radius: radiusKm * 1000, color: "#D63E0A", weight: 2, fillColor: "#D63E0A", fillOpacity: 0.07, interactive: false }).addTo(map);
    }
    L.marker([shop.lat, shop.lng], {
      interactive: false,
      icon: L.divIcon({ className: "", html: '<div style="display:inline-block;background:#111;color:#fff;font:600 11px system-ui;padding:3px 8px;border-radius:9px;white-space:nowrap;transform:translate(-50%,-50%)">Our shop</div>', iconSize: [0, 0] }),
    }).addTo(map);
    const onMove = () => {
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    };
    map.on("move", onMove);
    mapRef.current = map;
    onMove();
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; props only describe the starting view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function locateMe() {
    if (!("geolocation" in navigator)) return setNote("Your browser can't share location. Move the map instead.");
    setLocating(true);
    setNote("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.setView([coords.latitude, coords.longitude], 17);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setNote("We couldn't get your location. Move the map until the pin is on your house.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  const km = distanceKm(center, shop);
  const outside = radiusKm > 0 && km > radiusKm;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Choose your delivery location">
      <div className="flex items-center justify-between border-b border-warm-gray bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div>
          <h2 className="font-display text-lg leading-tight">Pin your delivery location</h2>
          <p className="text-xs text-secondary-text">Move the map so the pin sits on your house.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close map" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-warm-gray"><X size={22} /></button>
      </div>

      <div className="relative flex-1">
        <div ref={box} className="absolute inset-0" />
        {/* The pin: its tip is at the exact centre of the map. */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-full">
          <svg width="38" height="50" viewBox="0 0 38 50" className="drop-shadow-lg">
            <path d="M19 49C19 49 3 31 3 19a16 16 0 0 1 32 0c0 12-16 30-16 30z" fill={outside ? "#6b7280" : "#D63E0A"} stroke="#fff" strokeWidth="3" />
            <circle cx="19" cy="19" r="6" fill="#fff" />
          </svg>
        </div>
        <button type="button" onClick={locateMe} disabled={locating} aria-label="Go to my location" className="absolute right-3 top-3 z-[1000] flex h-12 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium shadow-card">
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} className="text-accent" />} My location
        </button>
      </div>

      <div className="border-t border-warm-gray bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {note && <p className="mb-2 text-xs text-accent">{note}</p>}
        <p className={`mb-3 text-sm font-medium ${outside ? "text-accent" : "text-success"}`}>
          {radiusKm > 0
            ? outside
              ? `About ${km.toFixed(1)} km from the shop. We deliver within ${radiusKm} km, so move the pin closer.`
              : `About ${km.toFixed(1)} km from the shop. We deliver here.`
            : `About ${km.toFixed(1)} km from the shop.`}
        </p>
        <button
          type="button"
          disabled={outside}
          onClick={() => onConfirm({ lat: Math.round(center.lat * 1e6) / 1e6, lng: Math.round(center.lng * 1e6) / 1e6 })}
          className="btn-primary min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={16} /> Confirm this location
        </button>
      </div>
    </div>
  );
}
