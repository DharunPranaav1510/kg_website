import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { business } from "@/data/business";
import { formatAddress, parseAddress } from "@/lib/address";
import { deliveryFeeFor, MIN_ORDER } from "@/lib/delivery";
import {
  clientIpHash,
  evaluateOrderLimits,
  gatherOrderStats,
  LIMITS,
  orderFingerprint,
} from "@/lib/guard";
import { formatPhone, normalizeEmail, normalizeIndianMobile } from "@/lib/phone";
import { getProducts } from "@/lib/products-db";
import { getShopStatusFresh } from "@/lib/settings";
import { getSupabase } from "@/lib/supabase";

// Email is optional: skipped when RESEND_API_KEY is not set.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request");

    // Bot trap: real people never see or fill this field. Pretend it worked.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true, id: null, orderNumber: null, total: 0, deliveryFee: 0 });
    }
    // A human cannot fill in the checkout form in a couple of seconds.
    const elapsed = Date.now() - Number(body.startedAt);
    if (!Number.isFinite(elapsed) || elapsed < LIMITS.minFormSeconds * 1000) {
      return fail("Please review your details and try again.");
    }

    // Shop closed? Checked against the database, never a cached copy.
    const shop = await getShopStatusFresh();
    if (!shop.open) {
      return fail(
        `We're not taking orders right now. ${shop.message}`.trim(),
        403,
        { closed: true }
      );
    }

    const name = str(body.name, 80);
    if (name.length < 2) return fail("Please enter your name", 400, { field: "name" });

    const phone = normalizeIndianMobile(str(body.phone, 25));
    if (!phone) {
      return fail("Enter a valid 10-digit mobile number", 400, { field: "phone" });
    }

    const emailResult = normalizeEmail(str(body.email, 130));
    if (emailResult === null) return fail("That email doesn't look right", 400, { field: "email" });
    const email = emailResult ?? null;

    const addr = parseAddress(body.address);
    if ("error" in addr) return fail(addr.error, 400, { field: addr.field });
    const address = addr.value;

    const note = str(body.note, 300);
    const slot = str(body.slot, 60);
    if (!(business.delivery.slots as readonly string[]).includes(slot)) {
      return fail("Please choose a delivery slot", 400, { field: "slot" });
    }

    const rawItems: unknown = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) return fail("Your cart is empty");
    if (rawItems.length > 30) return fail("Too many items");

    // Prices come from the catalogue, never from the browser.
    const catalogue = await getProducts();
    let subtotal = 0;
    const items: {
      id: string;
      name: string;
      category: string;
      quantity: string;
      weightKg: number;
      price: number;
    }[] = [];
    const seen = new Set<string>();
    for (const item of rawItems as { id?: string; weightKg?: number }[]) {
      const product = catalogue.find((p) => p.id === item?.id);
      const weight = Number(item?.weightKg);
      if (!product || !Number.isFinite(weight) || weight <= 0 || weight > 3 || seen.has(product.id)) {
        return fail("Some items are no longer available. Please refresh and try again.");
      }
      seen.add(product.id);
      if (product.inStock === false) {
        return fail(`${product.name} is sold out. Please remove it and try again.`, 409);
      }
      const price = Math.round(product.pricePerKg * weight);
      subtotal += price;
      items.push({
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.isEgg ? `${weight === 0.5 ? "½" : weight} dozen` : `${weight} kg`,
        weightKg: weight,
        price,
      });
    }

    if (subtotal < MIN_ORDER) return fail(`Minimum order is ₹${MIN_ORDER}.`);
    const deliveryFee = deliveryFeeFor(subtotal);
    const total = subtotal + deliveryFee;

    // Abuse limits (blocked numbers, rate limits, duplicate orders).
    const supabase = getSupabase();
    const ipHash = clientIpHash(req);
    if (supabase) {
      const stats = await gatherOrderStats(supabase, {
        phone,
        ipHash,
        fingerprint: orderFingerprint(items),
      });
      const verdict = evaluateOrderLimits(stats);
      if (!verdict.ok) return fail(verdict.error, verdict.status);
    }

    let orderId: string | null = null;
    let orderNumber: number | null = null;
    const addressLine = formatAddress(address);
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: name,
          phone,
          email,
          address: addressLine,
          area: address.area,
          landmark: address.landmark ?? null,
          pincode: address.pincode,
          lat: address.lat ?? null,
          lng: address.lng ?? null,
          note: note || null,
          items,
          total,
          delivery_fee: deliveryFee,
          slot,
          ip_hash: ipHash,
        })
        .select("id, order_number")
        .single();
      if (error) {
        console.error("Supabase order insert error:", error);
        return fail("We couldn't save your order. Please try again or call the shop.", 500);
      }
      orderId = data.id;
      orderNumber = data.order_number;
    }

    const itemRows = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">${esc(item.name)}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">${esc(item.quantity)}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">₹${item.price}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#D63E0A;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:22px;">New Order${orderNumber ? ` #${orderNumber}` : ""} — call to confirm</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">
            ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #eee;border-top:none;">
          <p style="margin:4px 0;font-size:15px;"><strong>Name:</strong> ${esc(name)}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Phone:</strong> ${esc(formatPhone(phone))}</p>
          ${email ? `<p style="margin:4px 0;font-size:15px;"><strong>Email:</strong> ${esc(email)}</p>` : ""}
          <p style="margin:4px 0;font-size:15px;"><strong>Address:</strong> ${esc(addressLine)}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Slot:</strong> ${esc(slot)}</p>
          ${note ? `<p style="margin:4px 0;font-size:15px;"><strong>Note:</strong> ${esc(note)}</p>` : ""}
        </div>
        <div style="background:#fff;padding:0 32px 28px;border:1px solid #eee;border-top:none;">
          <table style="width:100%;border-collapse:collapse;font-size:15px;"><tbody>${itemRows}</tbody></table>
          <p style="margin:12px 0 0;font-size:14px;">Delivery: ${deliveryFee ? `₹${deliveryFee}` : "Free"}</p>
          <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#D63E0A;">Total ₹${total}</p>
        </div>
      </div>
    `;

    try {
      await resend?.emails.send({
        from: "onboarding@resend.dev",
        to: "kgbroilersandeggs@gmail.com",
        subject: `New Order from ${name} — ₹${total}`,
        html,
      });
    } catch (err) {
      // Email is best-effort; the order is already saved.
      console.error("Order email error:", err);
      if (!orderId) throw err;
    }

    return NextResponse.json({ success: true, id: orderId, orderNumber, total, deliveryFee });
  } catch (err) {
    console.error("Order error:", err);
    return fail("Failed to send order", 500);
  }
}
