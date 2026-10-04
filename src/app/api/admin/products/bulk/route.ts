import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { revalidateStorefront } from "@/lib/products-db";

interface Update {
  id: string;
  pricePerKg?: number;
  inStock?: boolean;
}

// Save many price / stock changes in one go (the "Prices" page).
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const body = await req.json().catch(() => null);
  const updates: Update[] = Array.isArray(body?.updates) ? body.updates : [];
  if (updates.length === 0 || updates.length > 200) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const rows: { id: string; patch: Record<string, unknown> }[] = [];
  for (const u of updates) {
    const patch: Record<string, unknown> = {};
    if (u.pricePerKg !== undefined) {
      const p = Number(u.pricePerKg);
      if (!Number.isFinite(p) || p < 0 || p > 100000) {
        return NextResponse.json({ error: "Enter valid prices" }, { status: 400 });
      }
      patch.price_per_kg = Math.round(p * 100) / 100;
    }
    if (typeof u.inStock === "boolean") patch.in_stock = u.inStock;
    if (typeof u.id !== "string" || Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }
    rows.push({ id: u.id, patch });
  }

  const results = await Promise.all(
    rows.map(({ id, patch }) => supabase.from("products").update(patch).eq("id", id))
  );
  const failed = results.filter((r) => r.error);
  if (failed.length) {
    console.error("Bulk update errors:", failed.map((f) => f.error));
    return NextResponse.json(
      { error: `${failed.length} of ${rows.length} changes failed. Please try again.` },
      { status: 500 }
    );
  }

  revalidateStorefront();
  return NextResponse.json({ success: true, updated: rows.length });
}
