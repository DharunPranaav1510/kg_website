import { getSupabase } from "@/lib/supabase";
import { shopCategories } from "@/data/products";

/** The built-in categories (they also drive GST defaults and the home page). */
export const BASE_CATEGORIES: string[] = shopCategories.filter((c) => c !== "All");
export const MAX_EXTRA_CATEGORIES = 30;

/** A category name from the admin: trimmed, single spaces, 2 to 40 characters. */
export function cleanCategoryName(v: unknown): string | null {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  return s.length >= 2 && s.length <= 40 ? s : null;
}

export const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Categories the admin added, saved in the settings table under "categories". */
export async function getExtraCategories(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("settings").select("value").eq("key", "categories").maybeSingle();
  const list = (data?.value as { names?: unknown } | null)?.names;
  return Array.isArray(list) ? list.map(cleanCategoryName).filter((n): n is string => !!n) : [];
}

export async function saveExtraCategories(names: string[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("settings").upsert({ key: "categories", value: { names }, updated_at: new Date().toISOString() });
  return !error;
}
