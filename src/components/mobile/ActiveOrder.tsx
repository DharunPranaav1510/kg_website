"use client";

import Link from "next/link";
import { ChevronRight, PhoneCall, Truck } from "lucide-react";
import { business } from "@/data/business";
import { useSavedOrders } from "./useSavedOrders";

/** Home-screen reminder for the newest order that is still open. */
export default function ActiveOrder() {
  const { orders, status } = useSavedOrders();
  const open = orders?.find((o) => status[o.id] === "new" || status[o.id] === "confirmed" || status[o.id] === "out_for_delivery");
  if (!open) return null;
  const s = status[open.id];
  const text =
    s === "new"
      ? `We will call you to confirm. Keep your phone nearby.`
      : s === "confirmed"
        ? "Confirmed. We are getting it ready."
        : "On its way to you.";
  const Icon = s === "out_for_delivery" ? Truck : PhoneCall;
  return (
    <Link href={`/order/${open.id}`} className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 active:bg-amber-100">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900"><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-amber-950">Order #{open.number} · {s === "new" ? "waiting for our call" : s === "confirmed" ? "confirmed" : "out for delivery"}</span>
        <span className="block text-xs text-amber-900">{text} {s === "new" ? `Or call ${business.contact.phoneDisplay}.` : ""}</span>
      </span>
      <ChevronRight size={18} className="flex-shrink-0 text-amber-900" />
    </Link>
  );
}
