import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <>
      <Navbar />
      <main>
        <PageHero title={title} subtitle={subtitle} label="Legal" image="/images/about/about-company.jpg" />
        <section className="py-12 sm:py-16 md:py-24 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-secondary-text mb-8">Last updated: {lastUpdated}</p>
            <div className="prose-legal space-y-6 text-secondary-text leading-relaxed">{children}</div>
            <div className="mt-12 pt-8 border-t border-warm-gray">
              <p className="text-sm text-secondary-text">
                Questions?{" "}
                <Link href="/contact" className="text-accent hover:underline">
                  Contact our support team
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
