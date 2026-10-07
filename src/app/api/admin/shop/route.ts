import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getShopStatusFresh, saveShopStatus } from "@/lib/settings";
import { istParts } from "@/lib/pricing";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ shop: await getShopStatusFresh() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (typeof body?.open !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 200) : "";

  // "forceOpen" opens the shop outside its hours for today only (Indian date). Left out, the
  // current choice is kept; false ends it. It lapses by itself, because tomorrow's date will not match.
  const current = await getShopStatusFresh();
  const forceOpenOn = body.forceOpen === true ? istParts(Date.now()).date : body.forceOpen === false ? "" : current.forceOpenOn;
  const open = body.forceOpen === true ? true : body.open;

  if (!(await saveShopStatus({ open, message, forceOpenOn }))) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  if (body.forceOpen === true) await audit("shop_open", "Opened outside the usual hours for today");
  else if (body.forceOpen === false) await audit("shop_closed", "Ended the late opening for today");
  else await audit(open ? "shop_open" : "shop_closed", message || undefined);
  return NextResponse.json({ shop: { open, message, forceOpenOn } });
}
