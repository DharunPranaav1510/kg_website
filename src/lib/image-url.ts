/**
 * Product photos may only come from this site's own /images folder or from our
 * Supabase Storage bucket, never from an arbitrary web address.
 */
export function isAllowedImageUrl(url: string, supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL): boolean {
  if (/^\/images\/[A-Za-z0-9._\-\/]+$/.test(url) && !url.includes("..")) return true;
  if (!supabaseUrl) return false;
  try {
    const base = new URL(supabaseUrl).origin;
    return url.startsWith(`${base}/storage/v1/object/public/product-images/`) && !url.includes("..");
  } catch {
    return false;
  }
}

