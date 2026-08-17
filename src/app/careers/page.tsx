import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { business } from "@/data/business";

export const metadata = createPageMetadata({
  title: "Careers",
  description: "Join the KG Foods team in Hosur. Open roles in processing, delivery, and customer service.",
  path: "/careers",
});

const openings = [
  {
    title: "Butcher / Meat Processor",
    type: "Full-time",
    location: "Hosur",
    description:
      "Experienced in poultry and mutton processing. FSSAI hygiene training provided. Minimum 2 years experience required.",
  },
  {
    title: "Delivery Executive",
    type: "Full-time",
    location: "Hosur",
    description:
      "Cold-chain delivery across Hosur neighbourhoods. Two-wheeler with valid license required. Attractive incentives.",
  },
  {
    title: "Customer Support Associate",
    type: "Part-time",
    location: "Hosur",
    description:
      "Handle order confirmations, delivery scheduling, and customer enquiries via phone and email. Tamil and English fluency required.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          title="Careers at KG Foods"
          subtitle="Help us bring farm-fresh, hygienic meat products to families across Hosur."
          label="Join Us"
          image="/images/about/about-company.jpg"
        />
        <section className="py-12 sm:py-16 md:py-24 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-secondary-text leading-relaxed mb-10">
              KG Foods has been serving Hosur since 2018. We&apos;re a growing
              team of butchers, delivery partners, and customer care specialists who care deeply
              about food quality and hygiene.
            </p>
            <div className="space-y-4">
              {openings.map((job) => (
                <div key={job.title} className="card-base p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <h2 className="font-display text-xl text-primary-text">{job.title}</h2>
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent bg-accent/8 px-3 py-1 rounded-full self-start">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-text mb-3">{job.location}</p>
                  <p className="text-sm text-secondary-text leading-relaxed mb-4">{job.description}</p>
                  <Link
                    href={`mailto:${business.contact.email}?subject=Application: ${encodeURIComponent(job.title)}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Apply via email →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
