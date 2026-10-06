"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * "Updated 12 seconds ago" with a Refresh button. The page re-reads itself every 15 seconds while it is
 * on screen and the order is still open, so the customer sees "Confirmed" or "Out for delivery" without doing anything.
 */
export default function OrderRefresh({ finished }: { finished: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [at, setAt] = useState(() => Date.now());
  const [, tick] = useState(0);

  const refresh = () =>
    start(() => {
      router.refresh();
      setAt(Date.now());
    });

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15000);
    const onShow = () => document.visibilityState === "visible" && !finished && refresh();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
    // refresh only touches stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const secs = Math.max(0, Math.round((Date.now() - at) / 1000));
  const text = secs < 8 ? "just now" : secs < 60 ? `${secs} seconds ago` : `${Math.floor(secs / 60)} min ago`;

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-xs text-secondary-text">
      <span aria-live="polite">
        {finished ? "This order is complete." : <>Updated {text}. This page updates by itself.</>}
      </span>
      <button type="button" onClick={refresh} disabled={pending} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-sm font-medium text-primary-text active:bg-warm-gray disabled:opacity-60">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
      </button>
    </div>
  );
}
