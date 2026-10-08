import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getShopStatusFresh, saveShopStatus } from "@/lib/settings";
import { getBusinessFresh } from "@/lib/content";
import { nextClosing } from "@/lib/hours";

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

  // "forceOpen: true" opens the shop outside its hours until the next regular closing time
  // (5 PM today if it is early morning, 5 PM tomorrow if it is already past closing).
  // "forceOpen: false" ends that early. Left out, the current choice is kept.
  const current = await getShopStatusFresh();
  let forceOpenUntil = current.forceOpenUntil;
  if (body.forceOpen === true) {
    const next = nextClosing((await getBusinessFresh()).hours.schedule);
    if (!next) return NextResponse.json({ error: "Set the opening hours first." }, { status: 400 });
    forceOpenUntil = next.at;
  } else if (body.forceOpen === false) {
    forceOpenUntil = 0;
  }
  const open = body.forceOpen === true ? true : body.open;

  if (!(await saveShopStatus({ open, message, forceOpenUntil }))) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  if (body.forceOpen === true) await audit("shop_open", `Opened outside the usual hours until ${new Date(forceOpenUntil).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`);
  else if (body.forceOpen === false) await audit("shop_closed", "Ended the late opening");
  else await audit(open ? "shop_open" : "shop_closed", message || undefined);
  return NextResponse.json({ shop: { open, message, forceOpenUntil } });
}
