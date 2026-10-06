/** The delivery rules in force. They come from the business details, which the admin can edit. */
export interface DeliveryRules {
  minOrder: number;
  fee: number;
  freeAbove: number;
}

export function deliveryFeeFor(subtotal: number, rules: DeliveryRules): number {
  return subtotal >= rules.freeAbove || subtotal === 0 ? 0 : rules.fee;
}

export function amountToFreeDelivery(subtotal: number, rules: DeliveryRules): number {
  return Math.max(0, rules.freeAbove - subtotal);
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
