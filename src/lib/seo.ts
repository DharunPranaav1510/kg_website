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

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MeatEstablishment",
    "@id": `${business.website}/#localbusiness`,
    name: business.name,
    description: business.seo.description,
    url: business.website,
    telephone: business.contact.phone,
    email: business.contact.email,
    image: `${business.website}${defaultOgImage}`,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.pincode,
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