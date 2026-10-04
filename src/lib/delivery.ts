import { business } from "@/data/business";

const { minOrder, fee, freeAbove } = business.delivery;

export const MIN_ORDER = minOrder;

export function deliveryFeeFor(subtotal: number): number {
  return subtotal >= freeAbove || subtotal === 0 ? 0 : fee;
}

export function amountToFreeDelivery(subtotal: number): number {
  return Math.max(0, freeAbove - subtotal);
}

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// "919876543210" for wa.me links; assumes India when 10 digits.
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}
