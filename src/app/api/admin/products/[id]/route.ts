import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import {
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
      active: p.active,
    })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  revalidateStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;
  const { id } = await params;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }

  revalidateStorefront();
  return NextResponse.json({ success: true });
}
