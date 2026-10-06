import type { Product, ProductSchedule } from "@/data/products";

// ---------------------------------------------------------------------------
// Everything about "what does this cost and can it be ordered right now".
// Used by the shop (browser) and by the order route (server), so both always agree.
// ---------------------------------------------------------------------------

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Indian date and time parts for an instant (the shop runs on IST). */
export function istParts(now: number | Date = Date.now()) {
  const d = new Date(typeof now === "number" ? now : now.getTime());
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute), day };
}

const toMinutes = (hhmm?: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export function clock12(hhmm: string): string {
  const m = toMinutes(hhmm);
  if (m === null) return hhmm;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function describeSchedule(s: ProductSchedule): string {
  const parts: string[] = [];
  if (s.days?.length && s.days.length < 7) parts.push([...s.days].sort().map((d) => DAY_NAMES[d].slice(0, 3)).join(", "));
  if (s.startTime && s.endTime) parts.push(`${clock12(s.startTime)} – ${clock12(s.endTime)}`);
  else if (s.startTime) parts.push(`from ${clock12(s.startTime)}`);
  else if (s.endTime) parts.push(`until ${clock12(s.endTime)}`);
  if (s.fromDate || s.toDate) parts.push(`${s.fromDate ?? "…"} to ${s.toDate ?? "…"}`);
  return parts.join(" · ") || "always";
}

/** Is the product inside its time / date window right now? */
export function isWithinSchedule(s: ProductSchedule | undefined, now: number | Date = Date.now()): boolean {
  if (!s) return true;
  const t = istParts(now);
  if (s.fromDate && t.date < s.fromDate) return false;
  if (s.toDate && t.date > s.toDate) return false;
  if (s.days?.length && s.days.length < 7 && !s.days.includes(t.day)) return false;
  const a = toMinutes(s.startTime);
  const b = toMinutes(s.endTime);
  if (a !== null && b !== null) {
    // a window that crosses midnight (22:00 to 02:00) is allowed
    return a <= b ? t.minutes >= a && t.minutes < b : t.minutes >= a || t.minutes < b;
  }
  if (a !== null && t.minutes < a) return false;
  if (b !== null && t.minutes >= b) return false;
  return true;
}

/** Message shown when something cannot be ordered right now, or null when it can. */
export function unavailableNote(p: Product, now: number | Date = Date.now()): string | null {
  if (!p.schedule || isWithinSchedule(p.schedule, now)) return null;
  return `Available ${describeSchedule(p.schedule)}`;
}

/** Should the product be left out of the shop completely at this moment? */
export function isHiddenNow(p: Product, now: number | Date = Date.now()): boolean {
  return !!p.schedule?.hideWhenUnavailable && !isWithinSchedule(p.schedule, now);
}

// ---------------------------------------------------------------------------
// Offers and prices
// ---------------------------------------------------------------------------

export function offerActive(p: Product, now: number | Date = Date.now()): boolean {
  const o = p.offer;
  if (!o || !(o.price >= 0) || o.price >= p.pricePerKg) return false;
  const t = typeof now === "number" ? now : now.getTime();
  if (o.from && t < new Date(o.from).getTime()) return false;
  if (o.to && t > new Date(o.to).getTime()) return false;
  return true;
}

/** The per-kg (or per-dozen) price a customer pays right now. */
export function effectivePrice(p: Product, now: number | Date = Date.now()): number {
  return offerActive(p, now) ? p.offer!.price : p.pricePerKg;
}

export function percentOff(p: Product, now: number | Date = Date.now()): number {
  return offerActive(p, now) ? Math.round((1 - p.offer!.price / p.pricePerKg) * 100) : 0;
}

// ---------------------------------------------------------------------------
// Allowed quantities
// ---------------------------------------------------------------------------

export const STANDARD_WEIGHTS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];
export const STANDARD_EGG_WEIGHTS = [0.5, 1, 1.5, 2];

/** Cleaned, sorted list of quantities the customer can pick for this product. */
export function allowedWeightsFor(p: Pick<Product, "allowedWeights" | "isEgg">): number[] {
  const own = (p.allowedWeights ?? []).filter((w) => Number.isFinite(w) && w > 0 && w <= 50);
  const list = own.length ? own : p.isEgg ? STANDARD_EGG_WEIGHTS : STANDARD_WEIGHTS;
  return [...new Set(list.map((w) => Math.round(w * 100) / 100))].sort((a, b) => a - b);
}

export const isAllowedWeight = (p: Pick<Product, "allowedWeights" | "isEgg">, w: number) =>
  allowedWeightsFor(p).some((x) => Math.abs(x - w) < 1e-6);

/** Smallest allowed quantity at or above `wanted`. */
export function snapWeight(p: Pick<Product, "allowedWeights" | "isEgg">, wanted: number): number {
  const list = allowedWeightsFor(p);
  return list.find((w) => w >= wanted - 1e-6) ?? list[list.length - 1];
}

/** What the plain "Add" button puts in the cart: ½ kg (1 dozen for eggs), or the nearest larger allowed quantity. */
export const defaultWeight = (p: Pick<Product, "allowedWeights" | "isEgg">) => snapWeight(p, p.isEgg ? 1 : 0.5);

/** The next smaller / larger allowed quantity, or null at the ends. */
export function stepWeight(p: Pick<Product, "allowedWeights" | "isEgg">, current: number, dir: -1 | 1): number | null {
  const list = allowedWeightsFor(p);
  const i = list.findIndex((w) => Math.abs(w - current) < 1e-6);
  if (i === -1) return dir === 1 ? list.find((w) => w > current) ?? null : [...list].reverse().find((w) => w < current) ?? null;
  return list[i + dir] ?? null;
}

// ---------------------------------------------------------------------------
// GST
// ---------------------------------------------------------------------------

export interface TaxConfig {
  enabled: boolean;
  /** true: prices already include GST. false: GST is added on top at checkout. */
  inclusive: boolean;
  /** GST % per category, e.g. { "Frozen Products": 5 } */
  categoryRates: Record<string, number>;
}

export function gstRateFor(p: Pick<Product, "category" | "gstRate">, tax: TaxConfig): number {
  if (!tax.enabled) return 0;
  const rate = p.gstRate ?? tax.categoryRates[p.category] ?? 0;
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

export interface PricedLine {
  id: string;
  name: string;
  category: string;
  hsn: string;
  weightKg: number;
  unitPrice: number;
  /** Normal price when an offer applies (for the crossed-out display). */
  listPrice: number;
  /** What the customer pays for this line before any GST that is added on top. */
  price: number;
  gstRate: number;
  /** GST contained in / added to this line. */
  gstAmount: number;
}

export interface PricedCart {
  lines: PricedLine[];
  /** Sum of line prices: the figure the minimum order and free-delivery limit are checked against. */
  subtotal: number;
  gstTotal: number;
  /** GST that is added on top of the subtotal (0 when prices already include GST). */
  gstExtra: number;
  /** subtotal + gstExtra */
  payable: number;
}

export function priceCart(
  items: { product: Product; weightKg: number }[],
  tax: TaxConfig,
  now: number | Date = Date.now()
): PricedCart {
  const lines = items.map(({ product, weightKg }): PricedLine => {
    const unitPrice = effectivePrice(product, now);
    const price = Math.round(unitPrice * weightKg);
    const rate = gstRateFor(product, tax);
    const gstAmount = rate
      ? tax.inclusive
        ? Math.round((price - price / (1 + rate / 100)) * 100) / 100
        : Math.round(price * rate) / 100
      : 0;
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      hsn: product.hsn ?? "",
      weightKg,
      unitPrice,
      listPrice: product.pricePerKg,
      price,
      gstRate: rate,
      gstAmount,
    };
  });
  const subtotal = lines.reduce((n, l) => n + l.price, 0);
  const gstTotal = Math.round(lines.reduce((n, l) => n + l.gstAmount, 0) * 100) / 100;
  const gstExtra = tax.inclusive ? 0 : Math.round(gstTotal);
  return { lines, subtotal, gstTotal, gstExtra, payable: subtotal + gstExtra };
}

// ---------------------------------------------------------------------------
// Delivery distance
// ---------------------------------------------------------------------------

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
