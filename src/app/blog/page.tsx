import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";

export const metadata = createPageMetadata({
  title: "Blog",
  description: "Recipes, cooking tips, and freshness guides from the KG Foods kitchen.",
  path: "/blog",
});

const posts = [
  {
    title: "How to Store Fresh Chicken Safely at Home",
    excerpt:
      "Proper refrigeration and handling tips to keep your KG Foods chicken fresh for up to 48 hours.",
    date: "May 12, 2025",
    category: "Food Safety",
  },
  {
    title: "5 Quick Weeknight Recipes with Ready-to-Cook Cuts",
    excerpt:
      "From tandoori legs to cutlets — dinner on the table in under 30 minutes with minimal prep.",
    date: "April 28, 2025",
    category: "Recipes",
  },
  {
    title: "Why Free-Range Eggs Taste Different",
    excerpt:
      "Our sourcing standards for farm-fresh eggs and what makes the yolk richer and the shell stronger.",
    date: "April 10, 2025",
    category: "Sourcing",
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          title="KG Foods Blog"
          subtitle="Recipes, freshness tips, and stories from our Hosur kitchen."
          label="Insights"
          image="/images/categories/category-ready-to-cook.png"
        />
        <section className="py-12 sm:py-16 md:py-24 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {posts.map((post) => (
              <article key={post.title} className="card-base p-6 sm:p-8">
                <span className="text-xs font-semibold tracking-wide uppercase text-accent">
                  {post.category}
                </span>
                <h2 className="font-display text-xl sm:text-2xl text-primary-text mt-2 mb-3">
                  {post.title}
                </h2>
                <p className="text-secondary-text text-sm leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary-text">{post.date}</span>
                  <Link href="/contact" className="text-sm font-medium text-accent hover:underline">
                    Request full article
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
