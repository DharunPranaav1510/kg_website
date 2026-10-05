import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackForm from "./TrackForm";

export const metadata: Metadata = {
  title: "Track your order — KG Foods",
  description: "Check the status of your KG Foods order with your order number and mobile number.",
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] px-4 pb-16 pt-28">
        <div className="mx-auto max-w-md">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Track</span>
          <h1 className="mb-2 mt-2 font-display text-3xl text-primary-text sm:text-4xl">Where is my order?</h1>
          <p className="mb-6 text-secondary-text">
            Enter the order number from your confirmation and the mobile number you ordered with.
          </p>
          <TrackForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
