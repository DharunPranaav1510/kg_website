import { NextRequest, NextResponse } from "next/server";
import { clientIpHash } from "@/lib/guard";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A customer rates a delivered order from its page. The order's random id is the key, so only
// someone who has the link can leave feedback, and only once per order.
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Feedback is not available right now." }, { status: 503 });
  if (!(await allow(supabase, "feedback", clientIpHash(req), 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const rating = Math.round(Number(body?.rating));
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) : "";
  if (!UUID.test(orderId) || !(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: "Please choose a rating from 1 to 5." }, { status: 400 });
  }

  const { data: order } = await supabase.from("orders").select("id, status").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "We couldn't find this order." }, { status: 404 });
  if (order.status !== "delivered") return NextResponse.json({ error: "You can rate your order once it has been delivered." }, { status: 409 });

  const { error } = await supabase.from("order_feedback").insert({ order_id: orderId, rating, comment: comment || null });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You have already sent feedback for this order. Thank you!" }, { status: 409 });
    console.error("Feedback insert error:", error);
    return NextResponse.json({ error: "We couldn't save your feedback. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
