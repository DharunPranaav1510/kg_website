import type { Metadata } from "next";
import { business } from "@/data/business";
import { createPageMetadata } from "@/lib/seo";
import Providers from "@/components/Providers";
import BackToTop from "@/components/BackToTop";
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(business.website),
  ...createPageMetadata({
    title: "KG Foods — Fresh. Hygienic. Trusted.",
    description: business.seo.description,
    path: "/",
    ogImage: "/images/hero/hero-main.jpg",
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo/kg-logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FAF8F5" />
        <LocalBusinessJsonLd />
      </head>
      <body className="antialiased bg-background text-primary-text">
        <Providers>{children}</Providers>
        <BackToTop />
      </body>
    </html>
  );
}