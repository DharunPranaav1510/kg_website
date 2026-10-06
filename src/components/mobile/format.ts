import type { Product } from "@/data/products";

/** 0.25 -> "¼", 1.5 -> "1½". Whole numbers stay plain. */
export function fraction(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const rest = Math.round((n - whole) * 100) / 100;
  const sym = rest === 0.25 ? "¼" : rest === 0.5 ? "½" : rest === 0.75 ? "¾" : "";
  if (rest !== 0 && !sym) return String(n);
  return `${whole || ""}${sym}` || "0";
}

export const qtyLabel = (p: Product, w: number) => `${fraction(w)} ${p.isEgg ? "dz" : "kg"}`;
export const stepFor = (p: Product) => (p.isEgg ? 0.5 : 0.25);
export const maxFor = (p: Product) => (p.isEgg ? 2 : 3);
export const defaultQty = (p: Product) => (p.isEgg ? 1 : 0.5);

export function tap() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* not supported */
  }
}
