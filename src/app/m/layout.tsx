import type { Viewport } from "next";
import TabBar from "@/components/mobile/TabBar";
import CartPill from "@/components/mobile/CartPill";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF8F5",
};

// The phone layout. Reached only through the proxy, which serves it at the normal URLs.
export default function PhoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kg-mobile min-h-[100dvh] pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      {children}
      <CartPill />
      <TabBar />
    </div>
  );
}
