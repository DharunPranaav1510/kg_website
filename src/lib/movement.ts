/** How well each product sold lately, to find the slow movers that could use an offer. */
export interface MovementOrder {
  created_at: string;
  status: string;
  items: { id?: string; name: string; weightKg?: number; price?: number }[];
}

export interface Movement {
  orders: number;
  qty: number;
  revenue: number;
  lastOrderedAt: string | null;
}

export function productMovement(
  orders: MovementOrder[],
  products: { id: string; name: string }[]
): Record<string, Movement> {
  const byName = new Map(products.map((p) => [p.name, p.id]));
  const known = new Set(products.map((p) => p.id));
  const out: Record<string, Movement> = Object.fromEntries(
    products.map((p) => [p.id, { orders: 0, qty: 0, revenue: 0, lastOrderedAt: null } as Movement])
  );
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const it of o.items ?? []) {
      const id = it.id && known.has(it.id) ? it.id : byName.get(it.name);
      if (!id) continue;
      const m = out[id];
      m.orders += 1;
      m.qty += Number(it.weightKg) || 0;
      m.revenue += Number(it.price) || 0;
      if (!m.lastOrderedAt || o.created_at > m.lastOrderedAt) m.lastOrderedAt = o.created_at;
    }
  }
  return out;
}
