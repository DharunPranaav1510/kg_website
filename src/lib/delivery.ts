/** The delivery rules in force. They come from the business details, which the admin can edit. */
export interface DeliveryRules {
  minOrder: number;
  fee: number;
  /** Orders at or above this are delivered free. 0 = never free. */
  freeAbove: number;
}

export function deliveryFeeFor(subtotal: number, rules: DeliveryRules): number {
  return subtotal === 0 || (rules.freeAbove > 0 && subtotal >= rules.freeAbove) ? 0 : rules.fee;
}

export function amountToFreeDelivery(subtotal: number, rules: DeliveryRules): number {
  return rules.freeAbove > 0 ? Math.max(0, rules.freeAbove - subtotal) : 0;
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

/** Saved as the order's slot when the customer wants it as soon as possible. */
export const DELIVER_NOW = "Deliver now (as soon as possible)";
export const isValidSlot = (slot: string, slots: string[]) => slot === DELIVER_NOW || slots.includes(slot);
