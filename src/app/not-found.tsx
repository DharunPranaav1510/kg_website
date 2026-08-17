import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto py-24">
          <p className="font-display text-8xl sm:text-9xl font-bold text-warm-gray mb-6 leading-none">
            404
          </p>
          <div className="w-12 h-px bg-accent mx-auto mb-6" />
          <h1 className="font-display text-2xl sm:text-3xl text-primary-text mb-4">
            Page Not Found
          </h1>
          <p className="text-secondary-text text-base leading-relaxed mb-10">
            The page you're looking for doesn't exist or has been moved.
            Head back to the shop to browse our fresh products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white font-semibold text-sm rounded-full hover:bg-accent-light transition-colors"
            >
              Browse Products <ArrowRight size={15} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-text font-semibold text-sm rounded-full border border-warm-gray hover:border-accent/40 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
