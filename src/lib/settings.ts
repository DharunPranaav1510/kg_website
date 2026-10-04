import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export interface ShopStatus {
  open: boolean;
  /** Shown to customers while closed, e.g. "Back tomorrow at 6:30 AM". */
  message: string;
}

const DEFAULT_STATUS: ShopStatus = { open: true, message: "" };

async function readShopStatus(): Promise<ShopStatus> {
  const supabase = getSupabase();
  if (!supabase) return DEFAULT_STATUS;
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "shop")
    .maybeSingle();
  if (error) {
    console.error("Supabase settings fetch error:", error);
    return DEFAULT_STATUS;
  }
  const v = (data?.value ?? {}) as Partial<ShopStatus>;
  return {
    open: v.open !== false,
    message: typeof v.message === "string" ? v.message.slice(0, 200) : "",
  };
}

/** Cached for the storefront (refreshed instantly when an admin saves). */
export const getShopStatus = unstable_cache(readShopStatus, ["shop-status"], {
  tags: ["settings"],
  revalidate: 60,
});

/** Uncached read for places that must never act on stale data (placing orders). */
export const getShopStatusFresh = readShopStatus;

export async function saveShopStatus(status: ShopStatus): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("settings").upsert({
    key: "shop",
    value: status,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Supabase settings save error:", error);
    return false;
  }
  revalidateTag("settings", { expire: 0 });
  revalidatePath("/", "layout");
  return true;
}
