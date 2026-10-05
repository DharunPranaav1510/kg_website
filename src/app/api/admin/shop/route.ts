import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getShopStatusFresh, saveShopStatus } from "@/lib/settings";

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

  if (!(await saveShopStatus({ open: body.open, message }))) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  await audit(body.open ? "shop_open" : "shop_closed", message || undefined);
  return NextResponse.json({ shop: { open: body.open, message } });
}
