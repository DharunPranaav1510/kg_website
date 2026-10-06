export type SavedStatus = "new" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";

export const STATUS_TEXT: Record<SavedStatus, string> = {
  new: "Waiting for our call",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<SavedStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  out_for_delivery: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-warm-gray text-secondary-text",
};

export interface SavedOrder { id: string; number: number; total?: number; at?: number }
export const ORDERS_KEY = "kg-foods-orders";
const LAST_KEY = "kg-foods-last-order";

export function rememberOrder(o: SavedOrder) {
  try {
    const list: SavedOrder[] = JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? "[]");
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify([o, ...list.filter((x) => x.id !== o.id)].slice(0, 10)));
  } catch {
    /* private mode: fine */
  }
}

/** Orders placed on this phone, newest first (falls back to the single "last order" saved before lists existed). */
export function readSavedOrders(): SavedOrder[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? "[]");
    const ok = Array.isArray(list) ? list.filter((o) => o?.id && o?.number) : [];
    if (ok.length) return ok;
    const last = JSON.parse(window.localStorage.getItem(LAST_KEY) ?? "null");
    return last?.id && last?.number ? [{ id: last.id, number: last.number }] : [];
  } catch {
    return [];
  }
}

export async function fetchStatuses(ids: string[]): Promise<Record<string, SavedStatus>> {
  if (!ids.length) return {};
  try {
    const res = await fetch(`/api/order/status?ids=${ids.join(",")}`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as { orders?: { id: string; status: SavedStatus }[] };
    return Object.fromEntries((data.orders ?? []).map((o) => [o.id, o.status]));
  } catch {
    return {};
  }
}
