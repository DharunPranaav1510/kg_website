import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";
import {
  extrasToRow,
  parseProductInput,
  revalidateStorefront,
  rowToProduct,
} from "@/lib/products-db";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const { id } = await params;

  const parsed = parseProductInput(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const p = parsed.value;

  const { data: before } = await supabase.from("products").select("name, price_per_kg").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from("products")
    .update({
      name: p.name,
      category: p.category,
      price_per_kg: p.pricePerKg,
      image: p.image,
      badge: p.badge ?? null,
      description: p.description,
      is_egg: p.isEgg,
      featured: p.featured,
      in_stock: p.inStock,
      active: p.active,
      ...extrasToRow(p),
    })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const oldPrice = before ? Number(before.price_per_kg) : null;
  await audit(
    oldPrice !== null && oldPrice !== p.pricePerKg ? "prices_changed" : "product_updated",
    p.name,
    oldPrice !== null && oldPrice !== p.pricePerKg ? { changes: [{ name: p.name, from: `₹${oldPrice}`, to: `₹${p.pricePerKg}` }] } : { id }
  );
  revalidateStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
}

// Quick edits from the list: price and/or sold-out toggle.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};
  if (body && "pricePerKg" in body) {
    const price = Number(body.pricePerKg);
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });
    }
    update.price_per_kg = Math.round(price * 100) / 100;
  }
  if (body && typeof body.inStock === "boolean") update.in_stock = body.inStock;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: before } = await supabase.from("products").select("name, price_per_kg, in_stock").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    console.error("Admin product patch error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const changes: { name: string; from: string; to: string }[] = [];
  if (before && "price_per_kg" in update && Number(before.price_per_kg) !== update.price_per_kg) {
    changes.push({ name: before.name, from: `₹${Number(before.price_per_kg)}`, to: `₹${update.price_per_kg}` });
  }
  if (before && "in_stock" in update && before.in_stock !== update.in_stock) {
    changes.push({ name: before.name, from: before.in_stock ? "in stock" : "sold out", to: update.in_stock ? "in stock" : "sold out" });
  }
  if (changes.length) await audit("prices_changed", changes[0].name, { changes });
  revalidateStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const { id } = await params;

  const { data: gone } = await supabase.from("products").select("name").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }

  await audit("product_deleted", gone?.name ?? id, { id });
  revalidateStorefront();
  return NextResponse.json({ success: true });
}
