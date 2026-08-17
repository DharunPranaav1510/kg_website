import Image from "next/image";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { business } from "@/data/business";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Contact Us",
  description:
    `Get in touch with ${business.name} in Hosur. Call ${business.contact.phoneDisplay}, email ${business.contact.email}, or send us a message.`,
  path: "/contact",
});

const contactCards = [
  {
    icon: Phone,
    title: "Phone",
    value: business.contact.phoneDisplay,
    href: `tel:${business.contact.phone}`,
  },
  {
    icon: Mail,
    title: "Email",
    value: business.contact.email,
    href: `mailto:${business.contact.email}`,
  },
  {
    icon: MapPin,
    title: "Address",
    value: business.address.full,
    href: undefined,
  },
  {
    icon: Clock,
    title: "Hours",
    value: `${business.hours.display}, ${business.hours.days}`,
    href: undefined,
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="pt-28 pb-6 text-center px-4">
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-accent">
            Contact
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-primary-text mt-3 mb-4">
            Get In Touch
          </h1>
          <p className="text-secondary-text text-lg max-w-xl mx-auto">
            Questions about orders, delivery areas, or bulk enquiries? Our Hosur team is here to help.
          </p>
        </div>

        <section className="py-12 sm:py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
              {contactCards.map((card) => (
                <div key={card.title} className="card-base p-5 sm:p-7 text-center group">
                  <div className="w-12 h-12 rounded-xl bg-accent/8 flex items-center justify-center mx-auto mb-4 sm:mb-5 transition-colors duration-200 group-hover:bg-accent/15">
                    <card.icon size={20} className="text-accent" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-sm text-secondary-text uppercase tracking-wide mb-2">
                    {card.title}
                  </h3>
                  {card.href ? (
                    <a
                      href={card.href}
                      className="text-primary-text font-medium text-sm hover:text-accent transition-colors break-words"
                    >
                      {card.value}
                    </a>
                  ) : (
                    <p className="text-primary-text font-medium text-sm leading-snug">{card.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 items-start">
              <ContactForm />

              <div className="card-base overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-warm-gray">
                  <h3 className="font-display text-lg sm:text-xl text-primary-text mb-1">
                    Serving Hosur and Surrounding Areas
                  </h3>
                  <p className="text-sm text-secondary-text">
                    Same-day delivery in Hosur and surrounding areas. Call us to confirm availability for your neighbourhood.
                  </p>
                </div>
                <div className="relative aspect-[4/3] sm:aspect-video bg-warm-gray">
                  <iframe
                    title="KG Meat Mart location on Google Maps"
                    src={`https://www.google.com/maps?q=${business.maps.lat},${business.maps.lng}&z=15&output=embed`}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                <div className="p-5 sm:p-6 flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white border border-warm-gray flex-shrink-0">
                    <Image
                      src="/images/logo/kg-logo.png"
                      alt="KG Foods"
                      width={48}
                      height={48}
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary-text">{business.name}</p>
                    <p className="text-xs text-secondary-text mt-0.5">{business.address.full}</p>
                    <Link href="/shop" className="text-xs text-accent font-medium mt-1 inline-block hover:underline">
                      Order for delivery →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
