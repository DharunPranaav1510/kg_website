import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Anonymous but stable per-visitor id: HMAC of the IP, never the IP itself. */
export function clientIpHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const salt = process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "kg-foods";
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

// Limits. The phone number is the main key. IP limits are deliberately loose
// because many mobile customers share one carrier IP.
export const LIMITS = {
  phoneOpen: 2, // orders still waiting for the shop to confirm
  phonePerHour: 3,
  phonePerDay: 6,
  ipPerHour: 10,
  ipPerDay: 30,
  duplicateWindowMin: 15,
  minFormSeconds: 4, // a human can't fill the checkout form faster
  enquiryPerHour: 3,
};

export interface OrderStats {
  blocked: boolean;
  phoneOpen: number;
  phoneLastHour: number;
  phoneLastDay: number;
  ipLastHour: number;
  ipLastDay: number;
  duplicate: boolean;
}

export type GuardResult = { ok: true } | { ok: false; status: number; error: string };

/** Pure decision step so it can be unit-tested without a database. */
export function evaluateOrderLimits(s: OrderStats): GuardResult {
  const deny = (status: number, error: string): GuardResult => ({ ok: false, status, error });
  if (s.blocked)
    return deny(403, "We can't take online orders from this number. Please call the shop.");
  if (s.duplicate)
    return deny(
      409,
      "You already placed this exact order a few minutes ago. Someone from the shop will call you to confirm it."
    );
  if (s.phoneOpen >= LIMITS.phoneOpen)
    return deny(
      429,
      "You already have orders waiting for confirmation. Please wait for our call, or call the shop to change them."
    );
  if (s.phoneLastHour >= LIMITS.phonePerHour || s.phoneLastDay >= LIMITS.phonePerDay)
    return deny(429, "Too many orders from this number. Please call the shop to place more.");
  if (s.ipLastHour >= LIMITS.ipPerHour || s.ipLastDay >= LIMITS.ipPerDay)
    return deny(429, "Too many orders from this device. Please try again later or call the shop.");
  return { ok: true };
}

/** Same cart = same sorted "id:weight" list. */
export function orderFingerprint(items: { id?: string; weightKg?: number }[]): string {
  return items
    .map((i) => `${i.id}:${i.weightKg}`)
    .sort()
    .join("|");
}

interface RecentOrder {
  created_at: string;
  status: string;
  items: { id?: string; weightKg?: number }[];
}

export async function gatherOrderStats(
  supabase: SupabaseClient,
  opts: { phone: string; ipHash: string; fingerprint: string; now?: number }
): Promise<OrderStats> {
  const now = opts.now ?? Date.now();
  const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
  const hourAgo = now - 3600 * 1000;
  const dupAfter = now - LIMITS.duplicateWindowMin * 60 * 1000;

  const [{ data: blocked }, { data: byPhone }, { data: byIp }] = await Promise.all([
    supabase.from("blocked_phones").select("phone").eq("phone", opts.phone).maybeSingle(),
    supabase
      .from("orders")
      .select("created_at, status, items")
      .eq("phone", opts.phone)
      .gte("created_at", dayAgo),
    supabase.from("orders").select("created_at").eq("ip_hash", opts.ipHash).gte("created_at", dayAgo),
  ]);

  const phoneOrders = ((byPhone ?? []) as RecentOrder[]).filter((o) => o.status !== "cancelled");
  const ipOrders = (byIp ?? []) as { created_at: string }[];
  const t = (iso: string) => new Date(iso).getTime();

  return {
    blocked: !!blocked,
    phoneOpen: phoneOrders.filter((o) => o.status === "new").length,
    phoneLastHour: phoneOrders.filter((o) => t(o.created_at) >= hourAgo).length,
    phoneLastDay: phoneOrders.length,
    ipLastHour: ipOrders.filter((o) => t(o.created_at) >= hourAgo).length,
    ipLastDay: ipOrders.length,
    duplicate: phoneOrders.some(
      (o) => t(o.created_at) >= dupAfter && orderFingerprint(o.items) === opts.fingerprint
    ),
  };
}
