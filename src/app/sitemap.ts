import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.kgfoods.co.in";

  const staticRoutes = [
    { path: "",          priority: 1.0,  changeFrequency: "weekly"  as const },
    { path: "/shop",     priority: 0.9,  changeFrequency: "daily"   as const },
    { path: "/about",    priority: 0.7,  changeFrequency: "monthly" as const },
    { path: "/contact",  priority: 0.7,  changeFrequency: "monthly" as const },
    { path: "/blog",     priority: 0.5,  changeFrequency: "weekly"  as const },
    { path: "/careers",  priority: 0.4,  changeFrequency: "monthly" as const },
    { path: "/privacy",  priority: 0.3,  changeFrequency: "yearly"  as const },
    { path: "/terms",    priority: 0.3,  changeFrequency: "yearly"  as const },
    { path: "/refunds",  priority: 0.3,  changeFrequency: "yearly"  as const },
  ];

  return staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
