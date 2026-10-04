"use client";

import { useState } from "react";
import { formatPhone } from "@/lib/phone";
import { mapsLink } from "@/lib/address";
import { adminApi } from "./api";
import { customerHint, type CustomerHistory, type Order } from "./orderUtils";

const TONE = {
  good: "bg-success/10 text-success",
  neutral: "bg-warm-gray text-secondary-text",
  bad: "bg-red-100 text-red-700",
};

export function CustomerBadge({ history, blocked }: { history?: CustomerHistory; blocked?: boolean }) {
  const hint = customerHint(history);
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {blocked && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">BLOCKED NUMBER</span>}
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE[hint.tone]}`}>{hint.text}</span>
    </span>
  );
}

/** Address block with landmark and a Google Maps link (uses GPS pin if the customer shared it). */
export function AddressBlock({ o }: { o: Order }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-secondary-text">📍 {o.address}</p>
      <a
        href={mapsLink({ lat: o.lat, lng: o.lng, address: o.address })}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs font-medium text-accent hover:underline"
      >
        {o.lat != null ? "Open exact pin in Maps ↗" : "Search in Maps ↗"}
      </a>
    </div>
  );
}

export function ContactLines({ o }: { o: Order }) {
  return (
    <div className="space-y-0.5 text-sm">
      <a href={`tel:${o.phone}`} className="font-medium text-accent hover:underline">📞 {formatPhone(o.phone)}</a>
      {o.email && (
        <p>
          <a href={`mailto:${o.email}`} className="text-secondary-text hover:underline">✉ {o.email}</a>
        </p>
      )}
    </div>
  );
}

/** Block / unblock a phone number from placing online orders. */
export function BlockButton({
  phone,
  blocked,
  onChanged,
}: {
  phone: string;
  blocked: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!blocked && !window.confirm(`Block ${formatPhone(phone)} from ordering online?`)) return;
    setBusy(true);
    try {
      if (blocked) {
        await adminApi(`/api/admin/blocked?phone=${encodeURIComponent(phone)}`, { method: "DELETE" });
      } else {
        await adminApi("/api/admin/blocked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, reason: "Blocked from an order" }),
        });
      }
      onChanged();
    } catch (e) {
      window.alert((e as Error).message);
    }
    setBusy(false);
  }
  return (
    <button onClick={run} disabled={busy} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {blocked ? "Unblock number" : "Block number"}
    </button>
  );
}
