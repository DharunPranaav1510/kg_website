import { localBusinessJsonLd } from "@/lib/seo";

export default function LocalBusinessJsonLd() {
  const data = localBusinessJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
