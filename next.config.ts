import type { NextConfig } from "next";

// Product photos uploaded by admins are served from Supabase Storage.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;
const supabaseHost = supabaseOrigin ? new URL(supabaseOrigin).hostname : null;

const isDev = process.env.NODE_ENV !== "production";
const turnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Content-Security-Policy. Next.js injects small inline scripts to hydrate
// pages, so script-src needs 'unsafe-inline'; everything else is locked to
// this site plus the few third parties the pages really use.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${turnstile ? " https://challenges.cloudflare.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  // nominatim.openstreetmap.org: "use my location" address lookup
  `connect-src 'self' https://nominatim.openstreetmap.org${turnstile ? " https://challenges.cloudflare.com" : ""}${isDev ? " ws: wss:" : ""}`,
  // Google Maps embed on the contact page
  `frame-src https://www.google.com${turnstile ? " https://challenges.cloudflare.com" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Location is only requested by our own checkout; no camera, mic or payments.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const noStore = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Never cache anything private or personal.
      { source: "/admin/:path*", headers: noStore },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
      { source: "/order/:path*", headers: noStore },
      { source: "/track", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
};

export default nextConfig;
