import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderView from "@/components/OrderView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Track your order — KG Foods",
  robots: { index: false, follow: false },
};

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 px-4 min-h-[70vh]">
        <OrderView id={id} />
      </main>
      <Footer />
    </>
  );
}
