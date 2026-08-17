import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.kgfoods.co.in/sitemap.xml",
    host: "https://www.kgfoods.co.in",
  };
}
