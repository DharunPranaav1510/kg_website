import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { revalidateContent } from "@/lib/content";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "Show on the website": copies a customer's feedback into the reviews list (first name only).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = getSupabase()!;

  const { data, error } = await supabase
    .from("order_feedback")
    .select("rating, comment, orders(order_number, customer_name, items)")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to load", detail: dbDetail(error) }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!data.comment || data.comment.trim().length < 10) {
    return NextResponse.json({ error: "This feedback has no written comment to show as a review." }, { status: 400 });
  }
  const o = (Array.isArray(data.orders) ? data.orders[0] : data.orders) as { order_number: number; customer_name: string; items: { name: string }[] } | null;
  const firstName = (o?.customer_name ?? "Customer").trim().split(/\s+/)[0].slice(0, 40) || "Customer";

  const { data: last } = await supabase.from("testimonials").select("sort").order("sort", { ascending: false }).limit(1);
  const { error: e2 } = await supabase.from("testimonials").insert({
    name: firstName,
    role: "Customer",
    location: "",
    image: "",
    rating: data.rating,
    quote: data.comment.trim().slice(0, 600),
    product: o?.items?.[0]?.name ?? "",
    sort: (last?.[0]?.sort ?? -1) + 1,
    active: true,
  });
  if (e2) return NextResponse.json({ error: "Failed to add the review", detail: dbDetail(e2) }, { status: 500 });
  await audit("content_changed", "testimonials:from-feedback", { order: o?.order_number });
  revalidateContent();
  return NextResponse.json({ success: true });
}
