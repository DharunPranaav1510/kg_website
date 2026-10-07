"use client";

import { STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { formatPhone } from "@/lib/phone";
import { mapsLink } from "@/lib/address";
import { Phone } from "lucide-react";
import {
  NEXT,
  NEXT_LABEL,
  PREV,
  STATUS_STYLE,
  customerHint,
  formatAge,
  printSlip,
  whatsappLink,
  type CustomerHistory,
  type Order,
} from "./orderUtils";
import { clock, dayDate, rupees, SidePanel } from "./ui";

const WA_LABEL: Record<OrderStatus, string> = {
  new: "WhatsApp: about your order",
  confirmed: "WhatsApp: about your order",
  out_for_delivery: "WhatsApp: out for delivery",
  delivered: "WhatsApp: thanks for ordering",
  cancelled: "WhatsApp: about your order",
};

const HINT_TONE = { good: "bg-success/10 text-success", neutral: "bg-warm-gray text-secondary-text", bad: "bg-red-100 text-red-700" };

/** The whole order, in one place. Used by Today, Live orders and Order history. */
export default function OrderPanel({
  order,
  history,
  blocked,
  now,
  onClose,
  onStatus,
  onBlock,
  onUnblock,
}: {
  order: Order | null;
  history: Record<string, CustomerHistory>;
  blocked: string[];
  now: number;
  onClose: () => void;
  onStatus: (o: Order, s: OrderStatus) => void;
  onBlock: (phone: string) => void;
  onUnblock: (phone: string) => void;
}) {
  const o = order;
  const isBlocked = !!o && blocked.includes(o.phone);
  const hint = o ? customerHint(history[o.phone]) : null;
  const next = o ? NEXT[o.status] : undefined;
  const prev = o ? PREV[o.status] : undefined;

  return (
    <SidePanel
      open={!!o}
      onClose={onClose}
      title={o ? `Order #${o.order_number}` : ""}
      subtitle={
        o && (
          <span className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
            <span>{formatAge(now - new Date(o.created_at).getTime())} ago · {dayDate(o.created_at)}, {clock(o.created_at)}</span>
          </span>
        )
      }
      footer={
        o && (
          <div className="space-y-2">
            {next && (
              <button onClick={() => onStatus(o, next)} className="btn-primary min-h-12 w-full !text-base">
                {NEXT_LABEL[o.status]}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => printSlip(o)} className="min-h-12 rounded-full border border-warm-gray text-base font-medium hover:bg-cream">Print slip</button>
              <a href={`/admin/bill/${o.id}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-full border border-warm-gray text-base font-medium hover:bg-cream">Print bill</a>
              {prev && o.status !== "cancelled" && (
                <button onClick={() => onStatus(o, prev)} className="min-h-12 rounded-full border border-warm-gray text-base font-medium hover:bg-cream">Step back to {STATUS_LABEL[prev]}</button>
              )}
              {o.status !== "delivered" && o.status !== "cancelled" && (
                <button onClick={() => onStatus(o, "cancelled")} className="min-h-12 rounded-full border border-red-200 text-base font-medium text-red-600 hover:bg-red-50">Cancel order</button>
              )}
              <button onClick={() => (isBlocked ? onUnblock(o.phone) : onBlock(o.phone))} className="col-span-2 min-h-12 rounded-full border border-warm-gray text-base font-medium text-red-600 hover:bg-red-50">
                {isBlocked ? "Unblock this phone number" : "Block this phone number"}
              </button>
            </div>
          </div>
        )
      }
    >
      {o && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-lg">Customer</h3>
            <p className="text-lg font-semibold">{o.customer_name}</p>
            <p className="text-base">{formatPhone(o.phone)}</p>
            {o.email && <p className="text-base text-secondary-text">{o.email}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:${o.phone}`} className="btn-primary min-h-12 !text-base"><Phone size={18} /> Call</a>
              <a href={whatsappLink(o)} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-full border border-warm-gray px-3 text-center text-sm font-medium hover:bg-cream">{WA_LABEL[o.status]}</a>
            </div>
            {hint && <p className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${HINT_TONE[hint.tone]}`}>{hint.text}</p>}
            {isBlocked && <p className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">This number is blocked</p>}
            {o.note && <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-base text-yellow-900">“{o.note}”</p>}
          </section>

          <section>
            <h3 className="mb-2 text-lg">Delivery</h3>
            <p className="text-base font-medium">{o.slot ?? "No time chosen"}</p>
            <p className="mt-1 text-base text-secondary-text">{o.address}</p>
            {o.landmark && <p className="text-base text-secondary-text">Landmark: {o.landmark}</p>}
            <a href={mapsLink({ lat: o.lat, lng: o.lng, address: o.address })} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-12 items-center text-base font-medium text-accent hover:underline">
              {o.lat != null ? "Open exact pin in maps ↗" : "Search the address in maps ↗"}
            </a>
          </section>

          <section>
            <h3 className="mb-2 text-lg">Items</h3>
            <ul className="divide-y divide-warm-gray/70 border-y border-warm-gray/70">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3 py-2 text-base">
                  <span>{it.name} <span className="text-secondary-text">· {it.quantity}</span></span>
                  <span className="tabular-nums">{rupees(it.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between text-base text-secondary-text">
              <span>Delivery charge</span>
              <span className="tabular-nums">{Number(o.delivery_fee) ? rupees(Number(o.delivery_fee)) : "Free"}</span>
            </p>
            <p className="mt-1 flex justify-between text-lg font-semibold">
              <span>Total · pay on delivery</span>
              <span className="tabular-nums">{rupees(Number(o.total))}</span>
            </p>
          </section>
        </div>
      )}
    </SidePanel>
  );
}
