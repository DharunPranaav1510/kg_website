/** Phones only. Tablets and desktops get the full site (iPad and Android tablets do not say "Mobile"). */
export function isPhoneUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return false;
  return /iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|Android.+Mobile|Mobile.+Firefox|\bMobi\b/i.test(ua);
}

export type ViewPreference = "mobile" | "desktop" | null;

export const VIEW_COOKIE = "kg_view";

/** Customer pages that have a phone version: public path -> internal /m path. */
export function mobileTarget(pathname: string): string | null {
  if (pathname === "/") return "/m";
  if (pathname === "/shop" || pathname === "/track" || pathname === "/contact" || pathname === "/more") return `/m${pathname}`;
  if (/^\/order\/[^/]+$/.test(pathname)) return `/m${pathname}`;
  return null;
}

export function wantsMobile(pref: ViewPreference, ua: string | null | undefined): boolean {
  if (pref === "mobile") return true;
  if (pref === "desktop") return false;
  return isPhoneUserAgent(ua);
}
