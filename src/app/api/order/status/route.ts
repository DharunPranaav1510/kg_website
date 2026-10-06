import { NextRequest, NextResponse } from "next/server";
import { clientIpHash } from "@/lib/guard";
import { allow } from "@/lib/ratelimit";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Status only, for the order ids saved on a customer's own phone. The ids are random
// and unguessable (same exposure as the /order/<id> page), and nothing personal is returned.
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID.test(s))
    .slice(0, 10);
  if (!ids.length) return NextResponse.json({ orders: [] });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ orders: [] });
  if (!(await allow(supabase, "order_status", clientIpHash(req), 60, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { data } = await supabase.from("orders").select("id, status").in("id", ids);
  return NextResponse.json({ orders: data ?? [] });
}
