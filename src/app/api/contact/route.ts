import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "dskarthik63@gmail.com",
      subject: `New Enquiry from ${name} — KG Meat Mart`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#D63E0A;padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">New Enquiry — KG Meat Mart</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">
              ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </p>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #eee;border-top:none;">
            <p style="margin:4px 0;font-size:15px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Phone:</strong> ${phone}</p>
          </div>
          <div style="background:#FAF8F5;padding:24px 32px;border:1px solid #eee;border-top:none;">
            <h2 style="font-size:14px;color:#555;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.1em;">Message</h2>
            <p style="font-size:15px;color:#111;line-height:1.6;margin:0;">${message.replace(/\n/g, "<br/>")}</p>
          </div>
          <div style="background:#fff;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;">
            <p style="margin:0;font-size:13px;color:#888;">
              Sent from kgfoods.co.in — KG Meat Mart, NH 44, Anna Nagar, Hosur 635109
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
