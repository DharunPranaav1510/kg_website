"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-reads the page every 20s while it is on screen, so order status updates without a manual refresh. */
export default function AutoRefresh({ everyMs = 20000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);
  return null;
}
