import { business } from "@/data/business";
import { STATUS_LABEL, whatsappNumber, type OrderStatus } from "@/lib/delivery";

export interface Order {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string | null;
  items: { name: string; quantity: string; price: number }[];
  total: number;
  delivery_fee: number;
  slot: string | null;
  status: OrderStatus;
}

export const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "confirmed",
  confirmed: "out_for_delivery",
  out_for_delivery: "delivered",
};
export const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Confirm order",
  confirmed: "Out for delivery",
  out_for_delivery: "Mark delivered",
};
export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  out_for_delivery: "bg-violet-100 text-violet-800",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-red-100 text-red-700",
};



export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function whatsappLink(o: Order) {
  const msg =
    o.status === "out_for_delivery"
      ? `Hi ${o.customer_name}, your ${business.name} order #${o.order_number} is out for delivery.`
      : o.status === "delivered"
        ? `Hi ${o.customer_name}, thanks for ordering from ${business.name}! Order #${o.order_number} is delivered.`
        : `Hi ${o.customer_name}, this is ${business.name} about your order #${o.order_number} (₹${o.total}).`;
  return `https://wa.me/${whatsappNumber(o.phone)}?text=${encodeURIComponent(msg)}`;
}

export function printSlip(o: Order) {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  w.document.write(`<!doctype html><title>Order #${o.order_number}</title>
    <body style="font:14px monospace;width:300px;margin:8px">
    <h3 style="margin:0">${esc(business.name)}</h3>
    <div>Order #${o.order_number} · ${new Date(o.created_at).toLocaleString("en-IN")}</div><hr>
    <div><b>${esc(o.customer_name)}</b><br>${esc(o.phone)}<br>${esc(o.address)}</div>
    ${o.slot ? `<div>Slot: ${esc(o.slot)}</div>` : ""}${o.note ? `<div>Note: ${esc(o.note)}</div>` : ""}<hr>
    ${o.items.map((i) => `<div>${esc(i.name)} — ${esc(i.quantity)} <span style="float:right">₹${i.price}</span></div>`).join("")}<hr>
    <div>Delivery <span style="float:right">${Number(o.delivery_fee) ? "₹" + o.delivery_fee : "Free"}</span></div>
    <div><b>TOTAL (COD) <span style="float:right">₹${o.total}</span></b></div>
    <script>window.print()</script></body>`);
  w.document.close();
}


// "45s", "12 min", "2h 05m", "3 days"
export function formatAge(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"}`;
}

export function itemsSummary(o: Order, max = 2): string {
  const shown = o.items.slice(0, max).map((i) => `${i.name} ${i.quantity}`);
  const more = o.items.length - max;
  return shown.join(", ") + (more > 0 ? ` +${more} more` : "");
}

// Minutes an order may sit in a status before it needs attention.
export const WAIT_LIMITS: Partial<Record<OrderStatus, [warn: number, late: number]>> = {
  new: [5, 10],
  confirmed: [30, 60],
  out_for_delivery: [45, 90],
};

export type Urgency = "ok" | "warn" | "late";

export function urgencyOf(o: Order, now: number): Urgency {
  const limits = WAIT_LIMITS[o.status];
  if (!limits) return "ok";
  const mins = (now - new Date(o.created_at).getTime()) / 60000;
  return mins >= limits[1] ? "late" : mins >= limits[0] ? "warn" : "ok";
}

export const PREV: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "new",
  out_for_delivery: "confirmed",
  delivered: "out_for_delivery",
  cancelled: "new",
};
