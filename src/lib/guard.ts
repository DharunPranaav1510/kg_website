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

// Best-effort per-instance throttle for cheap lookups (no database round trip).
// Serverless instances don't share memory, so this only slows down casual abuse.
const hits = new Map<string, number[]>();
export function softRateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const k of hits.keys()) { hits.delete(k); break; }
  return true;
}

// ---------------------------------------------------------------------------
// Checking limits before inserting is not enough: many requests sent at the same moment all see
// "0 orders so far" and all pass. So after an order is saved we look again, rank the recent orders
// by time, and the order is kept only if it falls inside the limits. Earlier orders always win, so
// at most the allowed number survive however many arrive together.
// ---------------------------------------------------------------------------

export interface RankedOrder {
  id: string;
  created_at: string;
  status: string;
  items?: { id?: string; weightKg?: number }[];
}

const byTime = (a: RankedOrder, b: RankedOrder) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id.localeCompare(b.id);

/** Pure: is this just-saved order over a limit once everything saved so far is counted? */
export function raceVerdict(
  ownId: string,
  phoneOrders: RankedOrder[],
  ipOrders: RankedOrder[],
  fingerprint: string,
  now = Date.now()
): GuardResult {
  const deny = (error: string): GuardResult => ({ ok: false, status: 429, error });
  const t = (o: RankedOrder) => new Date(o.created_at).getTime();
  const hourAgo = now - 3600 * 1000;
  const dupAfter = now - LIMITS.duplicateWindowMin * 60 * 1000;

  const phone = phoneOrders.filter((o) => o.status !== "cancelled").sort(byTime);
  const ip = [...ipOrders].sort(byTime);
  const place = (list: RankedOrder[]) => list.findIndex((o) => o.id === ownId);

  const open = phone.filter((o) => o.status === "new");
  if (place(open) >= LIMITS.phoneOpen)
    return deny("You already have orders waiting for confirmation. Please wait for our call, or call the shop to change them.");
  if (place(phone.filter((o) => t(o) >= hourAgo)) >= LIMITS.phonePerHour || place(phone) >= LIMITS.phonePerDay)
    return deny("Too many orders from this number. Please call the shop to place more.");
  if (place(ip.filter((o) => t(o) >= hourAgo)) >= LIMITS.ipPerHour || place(ip) >= LIMITS.ipPerDay)
    return deny("Too many orders from this device. Please try again later or call the shop.");

  const own = place(phone);
  if (own > 0) {
    const sameCart = phone.slice(0, own).some((o) => t(o) >= dupAfter && orderFingerprint(o.items ?? []) === fingerprint);
    if (sameCart)
      return { ok: false, status: 409, error: "You already placed this exact order a few minutes ago. Someone from the shop will call you to confirm it." };
  }
  return { ok: true };
}

/** Looks at what is saved right now and applies raceVerdict to the order that was just inserted. */
export async function verifyAfterInsert(
  supabase: SupabaseClient,
  opts: { orderId: string; phone: string; ipHash: string; fingerprint: string }
): Promise<GuardResult> {
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [{ data: byPhone, error: e1 }, { data: byIp, error: e2 }] = await Promise.all([
    supabase.from("orders").select("id, created_at, status, items").eq("phone", opts.phone).gte("created_at", dayAgo),
    supabase.from("orders").select("id, created_at, status").eq("ip_hash", opts.ipHash).gte("created_at", dayAgo),
  ]);
  if (e1 || e2) return { ok: true }; // a lookup problem must not cancel a real customer's order
  return raceVerdict(opts.orderId, (byPhone ?? []) as RankedOrder[], (byIp ?? []) as RankedOrder[], opts.fingerprint);
}
