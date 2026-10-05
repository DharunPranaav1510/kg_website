"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const LAST_ORDER_KEY = "kg-foods-last-order";

export default function TrackForm() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ id: string; number: number } | null>(null);

  useEffect(() => {
    try {
      const v = JSON.parse(window.localStorage.getItem(LAST_ORDER_KEY) ?? "null");
      if (v?.id && v?.number) setLast(v);
    } catch {
      /* ignore */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: number, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/order/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const input = "min-h-12 w-full rounded-xl border border-warm-gray bg-white px-4 py-3 text-base focus:border-accent/40 focus:outline-none focus:shadow-glow";

  return (
    <div className="space-y-5">
      {last && (
        <Link href={`/order/${last.id}`} className="flex items-center justify-between rounded-2xl border border-success/30 bg-success/10 px-4 py-3.5 text-sm font-medium text-success">
          <span>Your last order on this device: #{last.number}</span>
          <span>View →</span>
        </Link>
      )}
      <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-warm-gray bg-white p-5 shadow-soft">
        <div>
          <label htmlFor="tr-number" className="mb-1.5 block text-sm font-medium">Order number</label>
          <input id="tr-number" inputMode="numeric" autoComplete="off" placeholder="e.g. 57" value={number} onChange={(e) => setNumber(e.target.value.replace(/[^\d#]/g, ""))} className={input} />
        </div>
        <div>
          <label htmlFor="tr-phone" className="mb-1.5 block text-sm font-medium">Mobile number</label>
          <input id="tr-phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
        </div>
        {error && <p role="alert" className="rounded-xl bg-accent/10 px-3 py-2.5 text-sm text-accent">{error}</p>}
        <button type="submit" disabled={busy || !number || !phone} className="btn-primary min-h-12 w-full disabled:opacity-60">
          {busy ? "Looking…" : "Track order"}
        </button>
      </form>
    </div>
  );
}
