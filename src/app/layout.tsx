import type { Metadata } from "next";
import { business } from "@/data/business";
import { createPageMetadata } from "@/lib/seo";
import { fraunces, dmSans } from "@/lib/fonts";
import { getProducts } from "@/lib/products-db";
import { getShopStatus } from "@/lib/settings";
import Providers from "@/components/Providers";
import AutoView from "@/components/mobile/AutoView";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, shop] = await Promise.all([getProducts(), getShopStatus()]);

  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/images/logo/kg-logo.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="KG Foods" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FAF8F5" />
        <LocalBusinessJsonLd />
      </head>
      <body className="font-body antialiased bg-background text-primary-text">
        <Providers products={products} shop={shop}>{children}</Providers>
        <BackToTop />
        <AutoView />
      </body>
    </html>
  );
}