import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";
import {
  parseProductInput,
  productToRow,
  revalidateStorefront,
  rowToProduct,
  slugify,
} from "@/lib/products-db";

// List every product (including hidden ones) for the admin panel.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Admin products fetch error:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
  return NextResponse.json({ products: data.map(rowToProduct) });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const parsed = parseProductInput(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const p = parsed.value;

  const { data, error } = await supabase
    .from("products")
    .insert({ ...productToRow({ ...p, id: slugify(p.name) }), active: p.active })
    .select()
    .single();
  if (error) {
    console.error("Admin product insert error:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }

  await audit("product_created", p.name, { id: data.id, price: p.pricePerKg });
  revalidateStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
}
