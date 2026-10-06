import { getBusiness } from "@/lib/content";
import { localBusinessJsonLd, safeJsonForScript } from "@/lib/seo";

export default async function LocalBusinessJsonLd() {
  const data = localBusinessJsonLd(await getBusiness());

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonForScript(data) }}
    />
  );
}
