import Navbar from "@/components/Navbar";
import DeliveryStrip from "@/components/DeliveryStrip";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import FeaturedProducts from "@/components/FeaturedProducts";
import WhyKGFoods from "@/components/WhyKGFoods";
import ProcessSection from "@/components/ProcessSection";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import { getFaqs } from "@/lib/content";
import Footer from "@/components/Footer";

export default async function HomePage() {
  const faqs = await getFaqs();
  return (
    <>
      <Navbar />
      <DeliveryStrip />
      <main>
        <Hero />
        <TrustBar />
        <FeaturedProducts />
        <WhyKGFoods />
        <ProcessSection />
        <Testimonials />
        {faqs.length > 0 && <FAQ items={faqs} />}
        <CTA />
      </main>
      <Footer />
    </>
  );
}
