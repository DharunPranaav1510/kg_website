import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import {
  BASE_CATEGORIES,
  MAX_EXTRA_CATEGORIES,
  cleanCategoryName,
  getExtraCategories,
  sameName,
  saveExtraCategories,
} from "@/lib/categories-db";
import { getSupabase } from "@/lib/supabase";

const list = async () => {
  const extra = await getExtraCategories();
  return { base: BASE_CATEGORIES, extra, all: [...BASE_CATEGORIES, ...extra] };
};

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await list());
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const name = cleanCategoryName((await req.json().catch(() => null))?.name);
  if (!name) return NextResponse.json({ error: "Type a category name of 2 to 40 characters." }, { status: 400 });
  const { all, extra } = await list();
  if (all.some((c) => sameName(c, name))) return NextResponse.json({ error: `"${name}" already exists.` }, { status: 409 });
  if (extra.length >= MAX_EXTRA_CATEGORIES) return NextResponse.json({ error: "That is too many categories." }, { status: 400 });
  if (!(await saveExtraCategories([...extra, name]))) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  await audit("category_added", name);
  return NextResponse.json(await list());
}

// Remove a category you added. Built-in ones, and ones with products in them, stay.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const { extra } = await list();
  const hit = extra.find((c) => c === name);
  if (!hit) return NextResponse.json({ error: "Only categories you added can be removed." }, { status: 400 });
  const { count } = await getSupabase()!.from("products").select("id", { count: "exact", head: true }).eq("category", hit);
  if (count) return NextResponse.json({ error: `${count} product${count === 1 ? " is" : "s are"} still in "${hit}". Move or delete them first.` }, { status: 409 });
  if (!(await saveExtraCategories(extra.filter((c) => c !== hit)))) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  await audit("category_removed", hit);
  return NextResponse.json(await list());
}
