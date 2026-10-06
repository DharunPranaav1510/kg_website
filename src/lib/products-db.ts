import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { isAllowedImageUrl } from "@/lib/image-url";
import {
  products as defaultProducts,
  shopCategories,
  type Product,
  type ProductOffer,
  type ProductSchedule,
} from "@/data/products";

export const PRODUCT_CATEGORIES = shopCategories.filter((c) => c !== "All");

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  price_per_kg: number | string;
  image: string;
  badge: string | null;
  description: string;
  is_egg: boolean;
  featured: boolean;
  active: boolean;
  in_stock: boolean;
  allowed_weights?: (number | string)[] | null;
  gst_rate?: number | string | null;
  hsn?: string | null;
  offer_price?: number | string | null;
  offer_label?: string | null;
  offer_from?: string | null;
  offer_to?: string | null;
  schedule?: ProductSchedule | null;
}

export type AdminProduct = Product & { active: boolean };

export function rowToProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    pricePerKg: Number(row.price_per_kg),
    image: row.image,
    badge: row.badge ?? undefined,
    description: row.description,
    isEgg: row.is_egg,
    featured: row.featured,
    inStock: row.in_stock,
    active: row.active,
    allowedWeights: row.allowed_weights?.length ? row.allowed_weights.map(Number) : undefined,
    gstRate: row.gst_rate === null || row.gst_rate === undefined ? null : Number(row.gst_rate),
    hsn: row.hsn || undefined,
    offer:
      row.offer_price === null || row.offer_price === undefined
        ? undefined
        : {
            price: Number(row.offer_price),
            label: row.offer_label || undefined,
            from: row.offer_from || undefined,
            to: row.offer_to || undefined,
          },
    schedule: row.schedule && Object.keys(row.schedule).length ? row.schedule : undefined,
  };
}

/** Columns for the optional product settings, used by both insert and update. */
export function extrasToRow(p: Pick<Product, "allowedWeights" | "gstRate" | "hsn" | "offer" | "schedule">) {
  return {
    allowed_weights: p.allowedWeights?.length ? p.allowedWeights : null,
    gst_rate: p.gstRate ?? null,
    hsn: p.hsn || null,
    offer_price: p.offer?.price ?? null,
    offer_label: p.offer?.label ?? null,
    offer_from: p.offer?.from ?? null,
    offer_to: p.offer?.to ?? null,
    schedule: p.schedule ?? null,
  };
}

export function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price_per_kg: p.pricePerKg,
    image: p.image,
    badge: p.badge ?? null,
    description: p.description,
    is_egg: p.isEgg ?? false,
    featured: p.featured ?? false,
    in_stock: p.inStock ?? true,
    active: true,
  };
}

// Storefront catalogue. Falls back to the built-in list when the database is
// not configured, unreachable, or has no products yet.
export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const supabase = getSupabase();
    if (!supabase) return defaultProducts;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Supabase products fetch error:", error);
      return defaultProducts;
    }
    return data.length > 0 ? data.map(rowToProduct) : defaultProducts;
  },
  ["products"],
  { tags: ["products"], revalidate: 300 }
);

// Call after any admin change so the storefront updates immediately.
export function revalidateStorefront() {
  revalidateTag("products", { expire: 0 });
  revalidatePath("/", "layout");
}

export interface ProductInput {
  name: string;
  category: string;
  pricePerKg: number;
  image: string;
  badge?: string;
  description: string;
  isEgg: boolean;
  featured: boolean;
  inStock: boolean;
  active: boolean;
  allowedWeights?: number[];
  gstRate?: number | null;
  hsn?: string;
  offer?: ProductOffer;
  schedule?: ProductSchedule;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseSchedule(raw: unknown): { value?: ProductSchedule } | { error: string } {
  if (raw === null || raw === undefined || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: ProductSchedule = {};
  if (Array.isArray(r.days)) {
    const days = [...new Set(r.days.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (days.length && days.length < 7) out.days = days;
  }
  for (const k of ["startTime", "endTime"] as const) {
    const v = typeof r[k] === "string" ? (r[k] as string).trim() : "";
    if (v) {
      if (!TIME.test(v)) return { error: "Times must look like 06:30" };
      out[k] = v;
    }
  }
  for (const k of ["fromDate", "toDate"] as const) {
    const v = typeof r[k] === "string" ? (r[k] as string).trim() : "";
    if (v) {
      if (!DATE.test(v) || Number.isNaN(Date.parse(v))) return { error: "Dates must look like 2026-10-31" };
      out[k] = v;
    }
  }
  if (out.fromDate && out.toDate && out.fromDate > out.toDate) return { error: "The 'to' date must be after the 'from' date" };
  if (r.hideWhenUnavailable === true) out.hideWhenUnavailable = true;
  const meaningful = out.days || out.startTime || out.endTime || out.fromDate || out.toDate;
  return meaningful ? { value: out } : {};
}

// Validates untrusted admin input. Returns a clean object or an error message.
export function parseProductInput(
  body: unknown
): { value: ProductInput } | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid body" };
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 100) return { error: "Name is required (max 100 characters)" };

  const category = typeof b.category === "string" ? b.category : "";
  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(category))
    return { error: "Pick a valid category" };

  const pricePerKg = Number(b.pricePerKg);
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0 || pricePerKg > 100000)
    return { error: "Enter a valid price" };

  const image = typeof b.image === "string" ? b.image.trim() : "";
  if (!image) return { error: "Add a product photo" };
  if (!isAllowedImageUrl(image)) return { error: "Invalid image" };

  const badge = typeof b.badge === "string" ? b.badge.trim() : "";
  if (badge.length > 30) return { error: "Badge is too long (max 30 characters)" };

  const description = typeof b.description === "string" ? b.description.trim() : "";
  if (description.length > 500) return { error: "Description is too long (max 500 characters)" };

  const rawWeights = Array.isArray(b.allowedWeights) ? b.allowedWeights : [];
  const weights = [...new Set(rawWeights.map((w) => Math.round(Number(w) * 100) / 100))];
  if (weights.some((w) => !Number.isFinite(w) || w <= 0 || w > 50)) return { error: "Quantities must be between 0.01 and 50" };
  if (weights.length > 24) return { error: "Choose at most 24 quantities" };

  let gstRate: number | null = null;
  if (b.gstRate !== null && b.gstRate !== undefined && b.gstRate !== "") {
    gstRate = Number(b.gstRate);
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 40) return { error: "GST must be between 0 and 40 %" };
  }

  const hsn = typeof b.hsn === "string" ? b.hsn.trim() : "";
  if (hsn && !/^\d{2,8}$/.test(hsn)) return { error: "An HSN code is 2 to 8 digits" };

  let offer: ProductOffer | undefined;
  const o = b.offer as Record<string, unknown> | null | undefined;
  if (o && typeof o === "object" && o.price !== "" && o.price !== null && o.price !== undefined) {
    const op = Number(o.price);
    if (!Number.isFinite(op) || op < 0) return { error: "Enter a valid offer price" };
    if (op >= pricePerKg) return { error: "The offer price must be lower than the normal price" };
    const label = typeof o.label === "string" ? o.label.trim().slice(0, 30) : "";
    const from = typeof o.from === "string" && o.from ? new Date(o.from) : null;
    const to = typeof o.to === "string" && o.to ? new Date(o.to) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return { error: "Offer dates are not valid" };
    if (from && to && from > to) return { error: "The offer must end after it starts" };
    offer = { price: Math.round(op * 100) / 100, label: label || undefined, from: from?.toISOString(), to: to?.toISOString() };
  }

  const sched = parseSchedule(b.schedule);
  if ("error" in sched) return { error: sched.error };

  return {
    value: {
      allowedWeights: weights.length ? weights.sort((x, y) => x - y) : undefined,
      gstRate,
      hsn: hsn || undefined,
      offer,
      schedule: sched.value,
      name,
      category,
      pricePerKg: Math.round(pricePerKg * 100) / 100,
      image,
      badge: badge || undefined,
      description,
      isEgg: b.isEgg === true,
      featured: b.featured === true,
      inStock: b.inStock !== false,
      active: b.active !== false,
    },
  };
}

export function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${slug || "product"}-${Math.random().toString(36).slice(2, 6)}`;
}
