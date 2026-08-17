import { createPageMetadata } from "@/lib/seo";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "How KG Foods collects, uses, and protects your personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Your privacy matters to us. Here is how we handle your data."
      lastUpdated="June 1, 2025"
    >
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Information We Collect</h2>
        <p>
          When you place an order, contact us, or subscribe to updates, KG Foods may collect
          your name, phone number, email address, delivery address, and order history. We use
          this information solely to fulfil orders, improve our service, and communicate with
          you about your purchases.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">How We Use Your Data</h2>
        <p>
          We do not sell your personal information to third parties. Order data is shared only
          with our delivery partners to complete your delivery. Payment details are processed
          securely through our payment partners and are never stored on our servers.
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Data Retention</h2>
        <p>
          We retain order records for up to three years for accounting and quality assurance
          purposes. You may request deletion of your personal data by emailing{" "}
          <a href="mailto:info@kgfoods.com" className="text-accent hover:underline">
            info@kgfoods.com
          </a>
          .
        </p>
      </div>
      <div>
        <h2 className="font-display text-xl text-primary-text mb-3">Cookies</h2>
        <p>
          Our website uses essential cookies to maintain your shopping cart and session
          preferences. We do not use third-party advertising cookies.
        </p>
      </div>
    </LegalPageLayout>
  );
}
