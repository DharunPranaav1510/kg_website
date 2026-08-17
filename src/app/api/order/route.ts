import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, address, note, items, total } = body;

    if (!name || !phone || !address || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const itemRows = items
      .map(
        (item: { name: string; quantity: string; price: number }) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">${item.name}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">${item.quantity}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">₹${item.price}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#D63E0A;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:22px;">New Order — KG Meat Mart</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">
            ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>

        <div style="background:#fff;padding:28px 32px;border:1px solid #eee;border-top:none;">
          <h2 style="font-size:15px;color:#555;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">
            Customer Details
          </h2>
          <p style="margin:4px 0;font-size:15px;"><strong>Name:</strong> ${name}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Phone:</strong> ${phone}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Address:</strong> ${address}</p>
          ${note ? `<p style="margin:4px 0;font-size:15px;"><strong>Note:</strong> ${note}</p>` : ""}
        </div>

        <div style="background:#fff;padding:0 32px 28px;border:1px solid #eee;border-top:none;">
          <h2 style="font-size:15px;color:#555;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">
            Order Items
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <thead>
              <tr style="background:#FAF8F5;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#888;">Item</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#888;">Qty</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#888;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="margin-top:16px;padding-top:16px;border-top:2px solid #111;display:flex;justify-content:space-between;">
            <span style="font-size:16px;font-weight:700;">Total</span>
            <span style="font-size:18px;font-weight:700;color:#D63E0A;">₹${total}</span>
          </div>
        </div>

        <div style="background:#FAF8F5;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;">
          <p style="margin:0;font-size:13px;color:#888;">
            Sent from kgfoods.co.in — KG Meat Mart, NH 44, Anna Nagar, Hosur 635109
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kgbroilersandeggs@gmail.com",
      subject: `New Order from ${name} — ₹${total}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Order email error:", err);
    return NextResponse.json(
      { error: "Failed to send order" },
      { status: 500 }
    );
  }
}
