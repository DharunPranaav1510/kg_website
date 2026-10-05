import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";
import { business } from "@/data/business";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "How KG Foods collects, uses, and protects your personal information.",
  path: "/privacy",
});

const h2 = "font-display text-xl text-primary-text mb-3";
const link = "text-accent hover:underline";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Your privacy matters to us. Here is how we handle your data."
      lastUpdated="October 5, 2026"
    >
      <div>
        <h2 className={h2}>Information We Collect</h2>
        <p>
          When you place an order we collect your name, mobile number, delivery address
          (house number, street, area, landmark and pincode), delivery time preference, any
          note you write, and what you ordered. Your email address is optional. When you use
          our contact form we collect your name, mobile number, message and, if you choose to
          give it, your email address.
        </p>
      </div>
      <div>
        <h2 className={h2}>Your Location (optional)</h2>
        <p>
          If you tap &ldquo;Use my current location&rdquo; at checkout, your browser asks for
          permission and shares your coordinates with us so our delivery team can find you. To
          fill in your street and area, the coordinates are also sent to OpenStreetMap&rsquo;s
          address lookup service (nominatim.openstreetmap.org). You can decline, and type your
          address instead.
        </p>
      </div>
      <div>
        <h2 className={h2}>How We Use Your Data</h2>
        <p>
          We use your details to call you to confirm your order, deliver it, and answer your
          questions. An order is confirmed only after someone from {business.name} contacts you.
          Payment is made on delivery. We do not take card or UPI details on this website. We do
          not sell your personal information. We share your name, number and address only with
          the people who deliver your order.
        </p>
      </div>
      <div>
        <h2 className={h2}>Keeping the Site Safe</h2>
        <p>
          To prevent fake and repeated orders we keep a scrambled, one-way code derived from your
          device&rsquo;s internet address (not the address itself) and we limit how many orders one
          mobile number can place. We may block numbers that are used to place false orders. Our
          forms may use a privacy-friendly security check (Cloudflare Turnstile).
        </p>
      </div>
      <div>
        <h2 className={h2}>Who Stores Your Data</h2>
        <p>
          Order and enquiry records are stored with our database provider (Supabase) and the
          website is hosted by Vercel. If email notifications are switched on, they are sent
          through Resend. These providers process data on our behalf only to run the shop.
        </p>
      </div>
      <div>
        <h2 className={h2}>Data Retention and Your Choices</h2>
        <p>
          We retain order records for up to three years for accounting and quality assurance
          purposes. You may ask us to correct or delete your personal data by emailing{" "}
          <a href={`mailto:${business.contact.email}`} className={link}>
            {business.contact.email}
          </a>{" "}
          or calling {business.contact.phoneDisplay}.
        </p>
      </div>
      <div>
        <h2 className={h2}>Cookies and Local Storage</h2>
        <p>
          Your browser stores your cart, and (to save you typing) your last delivery details and
          order number, on your own device. Staff sign-in uses essential cookies. We do not use
          advertising cookies or third-party trackers.
        </p>
      </div>
    </LegalPageLayout>
  );
}
