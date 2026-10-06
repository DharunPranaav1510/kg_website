import { defaultFaqs } from "@/data/faqs";
import { testimonials as defaultTestimonials } from "@/data/testimonials";
import { validateFaq, validateTestimonial, type Checked } from "@/lib/content-schema";

export const KINDS = ["testimonials", "faqs"] as const;
export type Kind = (typeof KINDS)[number];
export const isKind = (k: string): k is Kind => (KINDS as readonly string[]).includes(k);

export const validators: Record<Kind, (input: unknown) => Checked<Record<string, unknown>>> = {
  testimonials: validateTestimonial as (i: unknown) => Checked<Record<string, unknown>>,
  faqs: validateFaq as (i: unknown) => Checked<Record<string, unknown>>,
};

/** The built-in content, in the same shape the admin lists use. */
export function defaultItems(kind: Kind): Record<string, unknown>[] {
  return kind === "testimonials"
    ? defaultTestimonials.map((t, i) => ({ ...t, sort: i, active: true }))
    : defaultFaqs.map((f, i) => ({ ...f, sort: i, active: true }));
}

/** Fields stored in the database for a new row (drops the built-in ids). */
export function toRow(kind: Kind, item: Record<string, unknown>) {
  if (kind === "testimonials") {
    const { name, role, location, image, rating, quote, product } = item;
    return { name, role, location, image, rating, quote, product, sort: item.sort ?? 0, active: item.active !== false };
  }
  const { question, answer } = item;
  return { question, answer, sort: item.sort ?? 0, active: item.active !== false };
}
