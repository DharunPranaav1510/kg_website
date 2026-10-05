import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";
import { productToRow, revalidateStorefront } from "@/lib/products-db";
import { products as defaultProducts } from "@/data/products";

// One-click import of the built-in catalogue into an empty products table.
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });
  if (count) {
    return NextResponse.json({ error: "Products already exist" }, { status: 409 });
  }

  const { error } = await supabase.from("products").insert(defaultProducts.map(productToRow));
  if (error) {
    console.error("Admin seed error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }

  await audit("products_imported", `${defaultProducts.length} products`);
  revalidateStorefront();
  return NextResponse.json({ success: true });
}
