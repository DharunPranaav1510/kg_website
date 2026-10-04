import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import {
  products as defaultProducts,
  shopCategories,
  type Product,
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
    active: row.active,
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
  revalidateTag("products");
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
  active: boolean;
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
  if (!/^(\/|https:\/\/)/.test(image)) return { error: "Invalid image" };

  const badge = typeof b.badge === "string" ? b.badge.trim() : "";
  if (badge.length > 30) return { error: "Badge is too long (max 30 characters)" };

  const description = typeof b.description === "string" ? b.description.trim() : "";
  if (description.length > 500) return { error: "Description is too long (max 500 characters)" };

  return {
    value: {
      name,
      category,
      pricePerKg: Math.round(pricePerKg * 100) / 100,
      image,
      badge: badge || undefined,
      description,
      isEgg: b.isEgg === true,
      featured: b.featured === true,
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
