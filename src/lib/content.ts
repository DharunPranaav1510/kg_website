import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { mergeBusiness, type Business, type BusinessOverrides } from "@/lib/content-schema";
import { testimonials as defaultTestimonials, type Testimonial } from "@/data/testimonials";
import { defaultFaqs, type Faq } from "@/data/faqs";
import { BUILT_IN_POLICY_DATE, DEFAULT_POLICIES, POLICY_SLUGS, type PolicyDoc, type PolicySlug } from "@/data/policy-defaults";

const TAG = "content";
const cacheOpts = { tags: [TAG], revalidate: 60 };

export const isPolicySlug = (s: string): s is PolicySlug => (POLICY_SLUGS as readonly string[]).includes(s);

/** Call after any admin edit so the storefront shows it straight away. */
export function revalidateContent() {
  revalidateTag(TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- business details
async function readBusiness(): Promise<Business> {
  const supabase = getSupabase();
  if (!supabase) return mergeBusiness(null);
  const { data, error } = await supabase.from("settings").select("key, value").in("key", ["business", "hours"]);
  if (error) {
    console.error("Supabase business settings fetch error:", error);
    return mergeBusiness(null);
  }
  const by = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return mergeBusiness({ ...(by.business ?? {}), hours: by.hours ?? undefined } as BusinessOverrides);
}

export const getBusiness = unstable_cache(readBusiness, ["business-details"], cacheOpts);
/** Uncached: for places that must act on the current rules (placing an order). */
export const getBusinessFresh = readBusiness;

export async function readBusinessOverrides(): Promise<BusinessOverrides | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("settings").select("value").eq("key", "business").maybeSingle();
  return (data?.value ?? null) as BusinessOverrides | null;
}

// ---------------------------------------------------------------- testimonials
interface TestimonialRow {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  image: string | null;
  rating: number;
  quote: string;
  product: string | null;
  sort: number;
  active: boolean;
}

export const rowToTestimonial = (r: TestimonialRow): Testimonial => ({
  id: r.id,
  name: r.name,
  role: r.role ?? "",
  location: r.location ?? "",
  image: r.image ?? "",
  rating: r.rating,
  quote: r.quote,
  product: r.product ?? "",
});

async function readTestimonials(): Promise<Testimonial[]> {
  const supabase = getSupabase();
  if (!supabase) return defaultTestimonials;
  const { data, error } = await supabase.from("testimonials").select("*").order("sort").order("created_at");
  if (error || !data || data.length === 0) return defaultTestimonials;
  return (data as TestimonialRow[]).filter((r) => r.active).map(rowToTestimonial);
}
export const getTestimonials = unstable_cache(readTestimonials, ["testimonials"], cacheOpts);

// ---------------------------------------------------------------- FAQ
interface FaqRow { id: string; question: string; answer: string; sort: number; active: boolean }

async function readFaqs(): Promise<Faq[]> {
  const supabase = getSupabase();
  if (!supabase) return defaultFaqs;
  const { data, error } = await supabase.from("faqs").select("*").order("sort").order("created_at");
  if (error || !data || data.length === 0) return defaultFaqs;
  return (data as FaqRow[]).filter((r) => r.active).map((r) => ({ id: r.id, question: r.question, answer: r.answer }));
}
export const getFaqs = unstable_cache(readFaqs, ["faqs"], cacheOpts);

// ---------------------------------------------------------------- policies
export interface Policy extends PolicyDoc {
  slug: PolicySlug;
  /** ISO time of the last edit, or null while the built-in text is in use. */
  updatedAt: string | null;
}

async function readPolicy(slug: PolicySlug): Promise<Policy> {
  const fallback: Policy = { slug, ...DEFAULT_POLICIES[slug], updatedAt: null };
  const supabase = getSupabase();
  if (!supabase) return fallback;
  const { data, error } = await supabase.from("policies").select("title, subtitle, body, updated_at").eq("slug", slug).maybeSingle();
  if (error || !data) return fallback;
  return { slug, title: data.title, subtitle: data.subtitle ?? "", body: data.body, updatedAt: data.updated_at };
}
export const getPolicy = unstable_cache(readPolicy, ["policy"], cacheOpts);

/** Titles for lists and links. */
export async function getPolicyList(): Promise<{ slug: PolicySlug; title: string }[]> {
  return Promise.all(POLICY_SLUGS.map(async (slug) => ({ slug, title: (await getPolicy(slug)).title })));
}

/** Which version of each policy a customer agreed to (kept on the order as proof of consent). */
export async function getPolicyVersions(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  const out: Record<string, string> = Object.fromEntries(POLICY_SLUGS.map((s) => [s, "built-in"]));
  if (!supabase) return out;
  const { data } = await supabase.from("policies").select("slug, updated_at");
  for (const r of data ?? []) out[r.slug] = r.updated_at;
  return out;
}

export function formatPolicyDate(updatedAt: string | null): string {
  if (!updatedAt) return BUILT_IN_POLICY_DATE;
  return new Date(updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}
