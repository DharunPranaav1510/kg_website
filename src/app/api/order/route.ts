import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { business } from "@/data/business";
import { deliveryFeeFor, MIN_ORDER } from "@/lib/delivery";
import { getProducts } from "@/lib/products-db";
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
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = str(body.name, 100);
    const phone = str(body.phone, 20);
    const address = str(body.address, 300);
    const note = str(body.note, 300);
    const slot = str(body.slot, 60);
    const rawItems: unknown = body.items;

    if (!name || !phone || !address || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rawItems.length > 30) {
      return NextResponse.json({ error: "Too many items" }, { status: 400 });
    }
    if (slot && !(business.delivery.slots as readonly string[]).includes(slot)) {
      return NextResponse.json({ error: "Invalid delivery slot" }, { status: 400 });
    }

    // Prices come from the catalogue, never from the browser.
    const catalogue = await getProducts();
    let subtotal = 0;
    const items: { id: string; name: string; quantity: string; price: number }[] = [];
    for (const item of rawItems as { id?: string; weightKg?: number }[]) {
      const product = catalogue.find((p) => p.id === item?.id);
      const weight = Number(item?.weightKg);
      if (!product || !Number.isFinite(weight) || weight <= 0 || weight > 3) {
        return NextResponse.json(
          { error: "Some items are no longer available. Please refresh and try again." },
          { status: 400 }
        );
      }
      if (product.inStock === false) {
        return NextResponse.json(
          { error: `${product.name} is sold out. Please remove it and try again.` },
          { status: 409 }
        );
      }
      const price = Math.round(product.pricePerKg * weight);
      subtotal += price;
      items.push({
        id: product.id,
        name: product.name,
        quantity: product.isEgg
          ? `${weight === 0.5 ? "½" : weight} dozen`
          : `${weight} kg`,
        price,
      });
    }

    if (subtotal < MIN_ORDER) {
      return NextResponse.json(
        { error: `Minimum order is ₹${MIN_ORDER}.` },
        { status: 400 }
      );
    }
    const deliveryFee = deliveryFeeFor(subtotal);
    const total = subtotal + deliveryFee;

    let orderId: string | null = null;
    let orderNumber: number | null = null;
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: name,
          phone,
          address,
          note: note || null,
          items,
          total,
          delivery_fee: deliveryFee,
          slot: slot || null,
        })
        .select("id, order_number")
        .single();
      if (error) console.error("Supabase order insert error:", error);
      else {
        orderId = data.id;
        orderNumber = data.order_number;
      }
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
          <h1 style="color:white;margin:0;font-size:22px;">New Order${orderNumber ? ` #${orderNumber}` : ""} — KG Meat Mart</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">
            ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #eee;border-top:none;">
          <p style="margin:4px 0;font-size:15px;"><strong>Name:</strong> ${esc(name)}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Phone:</strong> ${esc(phone)}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Address:</strong> ${esc(address)}</p>
          ${slot ? `<p style="margin:4px 0;font-size:15px;"><strong>Slot:</strong> ${esc(slot)}</p>` : ""}
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
      console.error("Order email error:", err);
      // Email is best-effort; don't fail an order that was already saved.
      if (!orderId) throw err;
    }

    return NextResponse.json({ success: true, id: orderId, orderNumber, total, deliveryFee });
  } catch (err) {
    console.error("Order error:", err);
    return NextResponse.json({ error: "Failed to send order" }, { status: 500 });
  }
}
