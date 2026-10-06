import type { Metadata } from "next";
import AppBar from "@/components/mobile/AppBar";
import AutoRefresh from "@/components/mobile/AutoRefresh";
import OrderView from "@/components/OrderView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Track your order — KG Foods",
  robots: { index: false, follow: false },
};

export default async function PhoneOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <AppBar title="Your order" back="/track" />
      <main className="px-4 pb-6 pt-4">
        <OrderView id={id} />
        <p className="mt-4 text-center text-xs text-secondary-text">This page refreshes by itself.</p>
      </main>
      <AutoRefresh />
    </>
  );
}
