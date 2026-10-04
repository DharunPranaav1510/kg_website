import { business } from "@/data/business";

export interface DeliveryAddress {
  house: string; // flat / door number
  street: string; // street / building / locality line
  area: string; // neighbourhood (suggestions in business.delivery.areas)
  landmark?: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

export function parseAddress(
  raw: unknown
): { value: DeliveryAddress } | { error: string; field: keyof DeliveryAddress } {
  const b = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const house = clean(b.house, 60);
  const street = clean(b.street, 120);
  const area = clean(b.area, 60);
  const landmark = clean(b.landmark, 100);
  const pincode = clean(b.pincode, 6) || business.address.pincode;

  if (house.length < 1) return { error: "Enter your house / flat number", field: "house" };
  if (street.length < 3) return { error: "Enter your street or building name", field: "street" };
  if (area.length < 2) return { error: "Enter your area", field: "area" };
  if (!/^\d{6}$/.test(pincode)) return { error: "Pincode must be 6 digits", field: "pincode" };

  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const hasGps =
    Number.isFinite(lat) && Number.isFinite(lng) && lat > 6 && lat < 38 && lng > 68 && lng < 98;

  return {
    value: {
      house,
      street,
      area,
      landmark: landmark || undefined,
      pincode,
      ...(hasGps ? { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 } : {}),
    },
  };
}

/** One-line version used in emails, slips and the legacy `address` column. */
export function formatAddress(a: DeliveryAddress): string {
  return [
    `${a.house}, ${a.street}`,
    a.area,
    a.landmark ? `Near ${a.landmark}` : "",
    `${business.address.city} ${a.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function mapsLink(o: {
  lat?: number | null;
  lng?: number | null;
  address: string;
}): string {
  const q = o.lat != null && o.lng != null ? `${o.lat},${o.lng}` : o.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
