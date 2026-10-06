import { business as defaults } from "@/data/business";
import { isAllowedImageUrl } from "@/lib/image-url";

export interface Business extends Omit<typeof defaults, "contact" | "address" | "hours" | "delivery" | "legal" | "announcement"> {
  contact: { phone: string; phoneDisplay: string; whatsapp: string; email: string };
  address: { street: string; city: string; state: string; pincode: string; full: string };
  hours: { display: string; days: string; allDay: boolean; slots: { day: string; open: string; close: string }[] };
  delivery: { minOrder: number; fee: number; freeAbove: number; slots: string[]; areas: string[] };
  legal: { legalName: string; fssai: string; grievanceName: string; grievanceEmail: string; grievancePhone: string };
  announcement: { enabled: boolean; text: string; link: string };
}

/** Only these parts of the business details can be edited from the admin panel. */
export interface BusinessOverrides {
  contact?: Partial<Pick<Business["contact"], "phone" | "whatsapp" | "email">>;
  address?: Partial<Pick<Business["address"], "street" | "city" | "state" | "pincode">>;
  hours?: Partial<Business["hours"]>;
  delivery?: Partial<Pick<Business["delivery"], "minOrder" | "fee" | "freeAbove" | "slots" | "areas">>;
  legal?: Partial<Business["legal"]>;
  announcement?: Partial<Business["announcement"]>;
}

const digits = (s: string) => s.replace(/\D/g, "");

/** "9677833339", "+91 96778 33339" or "919677833339" -> "+919677833339". Null if it is not a 10 digit Indian number. */
export function shopPhone(input: string): string | null {
  const d = digits(input);
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return /^\d{10}$/.test(ten) ? `+91${ten}` : null;
}

export function phoneDisplay(e164: string): string {
  const d = digits(e164).slice(-10);
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export function mergeBusiness(overrides: BusinessOverrides | null | undefined): Business {
  const o = overrides ?? {};
  const contact: Business["contact"] = { ...defaults.contact, ...o.contact };
  contact.phoneDisplay = phoneDisplay(contact.phone);
  const address: Business["address"] = { ...defaults.address, ...o.address };
  address.full = `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
  return {
    ...defaults,
    contact,
    address,
    hours: { ...defaults.hours, slots: [...defaults.hours.slots], ...o.hours },
    delivery: { ...defaults.delivery, slots: [...defaults.delivery.slots], areas: [...defaults.delivery.areas], ...o.delivery },
    legal: { ...defaults.legal, ...o.legal },
    announcement: { ...defaults.announcement, ...o.announcement },
  };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Link targets we allow in banners and policy text. */
export function isSafeLink(href: string): boolean {
  return /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s-]+)$/i.test(href) && !/[<>"']/.test(href);
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateBusiness(input: unknown): Checked<BusinessOverrides> {
  const b = (input ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const c = b.contact ?? {};
  const a = b.address ?? {};
  const h = b.hours ?? {};
  const d = b.delivery ?? {};
  const l = b.legal ?? {};
  const n = b.announcement ?? {};

  const phone = shopPhone(str(c.phone, 30));
  if (!phone) return { ok: false, error: "Enter the shop phone as a 10 digit number." };
  const whatsapp = shopPhone(str(c.whatsapp, 30) || phone);
  if (!whatsapp) return { ok: false, error: "Enter the WhatsApp number as a 10 digit number." };
  const email = str(c.email, 120).toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, error: "Enter a valid shop email." };

  const street = str(a.street, 160);
  const city = str(a.city, 60);
  const state = str(a.state, 60);
  const pincode = str(a.pincode, 6);
  if (!street || !city || !state) return { ok: false, error: "Fill in the street, city and state." };
  if (!/^\d{6}$/.test(pincode)) return { ok: false, error: "The pincode must be 6 digits." };

  const hoursText = str(h.display, 60);
  const daysText = str(h.days, 60);
  if (!hoursText || !daysText) return { ok: false, error: "Fill in the opening hours and days." };

  const minOrder = num(d.minOrder);
  const fee = num(d.fee);
  const freeAbove = num(d.freeAbove);
  for (const [label, v, max] of [["Minimum order", minOrder, 5000], ["Delivery fee", fee, 1000], ["Free delivery limit", freeAbove, 20000]] as const) {
    if (!Number.isInteger(v) || v < 0 || v > max) return { ok: false, error: `${label} must be a whole number between 0 and ${max}.` };
  }
  const list = (v: unknown, max: number, len: number) =>
    (Array.isArray(v) ? v : []).map((x) => str(x, len)).filter(Boolean).slice(0, max);
  const slots = [...new Set(list(d.slots, 8, 60))];
  if (!slots.length) return { ok: false, error: "Add at least one delivery time slot." };
  const areas = [...new Set(list(d.areas, 60, 60))];

  const fssai = str(l.fssai, 20);
  if (fssai && !/^\d{14}$/.test(fssai)) return { ok: false, error: "An FSSAI number has 14 digits. Leave it empty if you do not have one yet." };
  const grievanceEmail = str(l.grievanceEmail, 120).toLowerCase();
  if (grievanceEmail && !EMAIL.test(grievanceEmail)) return { ok: false, error: "Enter a valid grievance email." };
  const grievancePhoneRaw = str(l.grievancePhone, 30);
  const grievancePhone = grievancePhoneRaw ? shopPhone(grievancePhoneRaw) : "";
  if (grievancePhone === null) return { ok: false, error: "Enter the grievance phone as a 10 digit number." };

  const text = str(n.text, 160);
  const link = str(n.link, 200);
  if (link && !isSafeLink(link)) return { ok: false, error: "The banner link must start with / or https://" };
  if (n.enabled === true && !text) return { ok: false, error: "Write the banner text, or switch the banner off." };

  return {
    ok: true,
    value: {
      contact: { phone, whatsapp, email },
      address: { street, city, state, pincode },
      hours: { display: hoursText, days: daysText },
      delivery: { minOrder, fee, freeAbove, slots, areas },
      legal: {
        legalName: str(l.legalName, 120),
        fssai,
        grievanceName: str(l.grievanceName, 80),
        grievanceEmail,
        grievancePhone: grievancePhone ? phoneDisplay(grievancePhone) : "",
      },
      announcement: { enabled: n.enabled === true, text, link },
    },
  };
}

export interface TestimonialInput {
  name: string;
  role: string;
  location: string;
  image: string;
  rating: number;
  quote: string;
  product: string;
  active: boolean;
}

export function validateTestimonial(input: unknown): Checked<TestimonialInput> {
  const t = (input ?? {}) as Record<string, unknown>;
  const name = str(t.name, 80);
  const quote = str(t.quote, 600);
  const rating = Math.round(num(t.rating));
  const image = str(t.image, 300);
  if (!name) return { ok: false, error: "Enter the customer's name." };
  if (quote.length < 10) return { ok: false, error: "The review text is too short." };
  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "The rating must be between 1 and 5." };
  if (image && !isAllowedImageUrl(image)) return { ok: false, error: "Upload the photo here, or leave it empty." };
  return {
    ok: true,
    value: { name, role: str(t.role, 80), location: str(t.location, 80), image, rating, quote, product: str(t.product, 80), active: t.active !== false },
  };
}

export interface FaqInput {
  question: string;
  answer: string;
  active: boolean;
}

export function validateFaq(input: unknown): Checked<FaqInput> {
  const f = (input ?? {}) as Record<string, unknown>;
  const question = str(f.question, 200);
  const answer = str(f.answer, 1500);
  if (question.length < 5) return { ok: false, error: "Write the question." };
  if (answer.length < 5) return { ok: false, error: "Write the answer." };
  return { ok: true, value: { question, answer, active: f.active !== false } };
}

export interface PolicyInput {
  title: string;
  subtitle: string;
  body: string;
}

export function validatePolicy(input: unknown): Checked<PolicyInput> {
  const p = (input ?? {}) as Record<string, unknown>;
  const title = str(p.title, 100);
  const subtitle = str(p.subtitle, 200);
  const body = typeof p.body === "string" ? p.body.replace(/\r\n/g, "\n").trim() : "";
  if (!title) return { ok: false, error: "Enter a title." };
  if (body.length < 20) return { ok: false, error: "The policy text is too short." };
  if (body.length > 30000) return { ok: false, error: "The policy text is too long." };
  return { ok: true, value: { title, subtitle, body } };
}

/** Values for the {{placeholders}} in policy text. Unknown placeholders are left as they are so mistakes stay visible. */
export function policyVariables(b: Business): Record<string, string> {
  const lg = b.legal;
  const dash = (v: string) => v || "(not set yet)";
  return {
    shop_name: b.name,
    legal_name: lg.legalName || b.name,
    phone: b.contact.phoneDisplay,
    email: b.contact.email,
    address: b.address.full,
    city: b.address.city,
    hours: `${b.hours.display}, ${b.hours.days}`,
    fssai: dash(lg.fssai),
    grievance_name: lg.grievanceName || "our team",
    grievance_email: lg.grievanceEmail || b.contact.email,
    grievance_phone: lg.grievancePhone || b.contact.phoneDisplay,
    delivery_fee: String(b.delivery.fee),
    free_above: String(b.delivery.freeAbove),
    min_order: String(b.delivery.minOrder),
    areas: b.delivery.areas.length ? b.delivery.areas.join(", ") : b.address.city,
    slots: b.delivery.slots.map((s) => `- ${s}`).join("\n"),
  };
}

export function fillVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}
