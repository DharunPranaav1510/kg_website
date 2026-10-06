"use client";

import ItemsEditor from "./ItemsEditor";

export default function TestimonialsEditor() {
  return (
    <ItemsEditor
      kind="testimonials"
      noun="review"
      empty={{ name: "", role: "", location: "", product: "", rating: 5, quote: "", image: "", active: true }}
      fields={[
        { key: "name", label: "Customer name", type: "text", max: 80, placeholder: "e.g. Priya" },
        { key: "quote", label: "What they said", type: "textarea", max: 600, hint: "Use the customer's own words." },
        { key: "rating", label: "Rating", type: "rating" },
        { key: "product", label: "Product they bought", type: "text", max: 80, optional: true, placeholder: "e.g. Chicken Breast" },
        { key: "role", label: "Role", type: "text", max: 80, optional: true, placeholder: "e.g. Home cook" },
        { key: "location", label: "Place", type: "text", max: 80, optional: true, placeholder: "e.g. Anna Nagar, Hosur" },
      ]}
      title={(i) => `${String(i.name)} · ${"★".repeat(Number(i.rating))}`}
      sub={(i) => String(i.quote)}
      intro={
        <Notice2>
          Only publish reviews from real customers, with their permission. Made-up reviews are not allowed under India&apos;s consumer protection rules. The
          &ldquo;average rating&rdquo; line on the home page is worked out from the reviews you show here.
        </Notice2>
      }
      defaultsNotice={
        <>
          <b>These are sample reviews that came with the website template. They are not from your customers.</b> Copy them in, then replace them with real
          reviews (or delete them) before the site goes live.
        </>
      }
    />
  );
}

function Notice2({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">{children}</p>;
}
