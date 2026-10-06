import type { NextRequest } from "next/server";
import { business } from "@/data/business";

/**
 * The address used in emailed links. It never comes from the request's Host header in production,
 * because a forged Host header could make an invitation point at someone else's website.
 * Set SITE_URL (for example https://www.kgfoods.co.in) in Vercel.
 */
export function siteUrl(req: NextRequest): string {
  const fixed = process.env.SITE_URL?.trim();
  if (fixed) return fixed.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return req.nextUrl.origin;
  return business.website.replace(/\/+$/, "");
}
