import { NextRequest, NextResponse } from "next/server";
import { clientIpHash, softRateLimit } from "@/lib/guard";
import { normalizeIndianMobile } from "@/lib/phone";
import { getSupabase } from "@/lib/supabase";

// "Where is my order?": order number + the phone number it was placed with.
export async function POST(req: NextRequest) {
  if (!softRateLimit(`track:${clientIpHash(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes or call the shop." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const number = Number(String(body?.orderNumber ?? "").replace(/[^\d]/g, ""));
  const phone = normalizeIndianMobile(String(body?.phone ?? ""));
  if (!Number.isInteger(number) || number < 1 || !phone) {
    return NextResponse.json({ error: "Enter your order number and the mobile number you ordered with." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data } = supabase
    ? await supabase.from("orders").select("id").eq("order_number", number).eq("phone", phone).maybeSingle()
    : { data: null };
  if (!data) {
    // Same message whether the number or the phone is wrong.
    return NextResponse.json({ error: "We couldn't find an order with that number and mobile number." }, { status: 404 });
  }
  return NextResponse.json({ id: data.id });
}
