import type { Metadata } from "next";
import AppBar from "@/components/mobile/AppBar";
import MyOrders from "@/components/mobile/MyOrders";
import TrackForm from "@/app/track/TrackForm";

export const metadata: Metadata = {
  title: "Your orders — KG Foods",
  robots: { index: false, follow: true },
};

export default function PhoneOrders() {
  return (
    <>
      <AppBar title="Orders" />
      <main className="px-4 pt-5">
        <MyOrders />
        <h2 className="mb-1 px-1 font-display text-xl">Find an order</h2>
        <p className="mb-4 px-1 text-sm text-secondary-text">Use the order number we gave you and the mobile number you ordered with.</p>
        <TrackForm />
      </main>
    </>
  );
}
