import type { Metadata } from "next";
import { business } from "@/data/business";

const defaultOgImage = "/images/hero/hero-main.jpg";

interface PageSeoOptions {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function createPageMetadata({
  title,
  description,
  path = "",
  ogImage = defaultOgImage,
  noIndex = false,
}: PageSeoOptions): Metadata {
  const url = `${business.website}${path}`;
  const fullTitle = title.includes(business.shortName)
    ? title
    : `${title} | ${business.shortName}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      "KG Foods",
      "KG Meat Mart",
      "fresh chicken Hosur",
      "premium mutton Hosur",
      "farm fresh eggs Hosur",
      "ready to cook",
      "hygienic meat delivery",
      "meat shop Hosur",
      "Tamil Nadu",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: business.shortName,
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${business.name} — ${business.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function localBusinessJsonLd(live?: { contact: { phone: string; email: string }; address: { street: string; city: string; state: string; pincode: string } }) {
  const contact = live?.contact ?? business.contact;
  const address = live?.address ?? business.address;
  return {
    "@context": "https://schema.org",
    "@type": "MeatEstablishment",
    "@id": `${business.website}/#localbusiness`,
    name: business.name,
    description: business.seo.description,
    url: business.website,
    telephone: contact.phone,
    email: contact.email,
    image: `${business.website}${defaultOgImage}`,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.pincode,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.maps.lat,
      longitude: business.maps.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "06:30",
        closes: "20:00",
      },
    ],
    sameAs: Object.values(business.social).filter(Boolean),
  };
}
/**
 * JSON for a <script type="application/ld+json"> tag. JSON.stringify leaves "<" alone, so a value such as
 * "</script><script>..." would end the tag and run. Escaping < > & and the two line separators keeps it data.
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
