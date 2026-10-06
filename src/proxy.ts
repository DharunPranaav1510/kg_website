import { NextRequest, NextResponse } from "next/server";
import { mobileTarget, VIEW_COOKIE, wantsMobile, type ViewPreference } from "@/lib/device";

/**
 * "Under development" switch.
 *
 * MAINTENANCE_MODE=true  -> every page shows /maintenance (HTTP 503) and every API call gets a 503.
 * Leave it unset (e.g. on your own machine) and the site works normally.
 *
 * Optional MAINTENANCE_BYPASS_KEY lets you preview the real site on the server:
 *   open  https://your-site/?preview=<key>  to unlock this browser for 12 hours,
 *   open  https://your-site/?preview=off    to lock it again.
 */
const COOKIE = "kg_preview";
const HALF_DAY = 60 * 60 * 12;

const on = () => (process.env.MAINTENANCE_MODE ?? "").trim().toLowerCase() === "true";

function sameKey(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Phones get the app-style screens under /m, served from the same URLs.
 * ?view=mobile | desktop remembers a choice; ?view=auto forgets it.
 * ?auto=1 makes the choice last only for this browser session (used by the width check).
 */
function phoneRouting(req: NextRequest): NextResponse {
  const { pathname, searchParams } = req.nextUrl;

  // The /m tree is an implementation detail: never reachable directly.
  if (pathname === "/m" || pathname.startsWith("/m/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/m" ? "/" : pathname.slice(2);
    return NextResponse.redirect(url);
  }

  const choice = searchParams.get("view");
  if (choice !== null) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("view");
    clean.searchParams.delete("auto");
    const res = NextResponse.redirect(clean);
    res.headers.set("Cache-Control", "no-store");
    if (choice === "mobile" || choice === "desktop") {
      res.cookies.set(VIEW_COOKIE, choice, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        ...(searchParams.get("auto") ? {} : { maxAge: 60 * 60 * 24 * 30 }),
      });
    } else {
      res.cookies.delete(VIEW_COOKIE);
    }
    return res;
  }

  const target = mobileTarget(pathname);
  const raw = req.cookies.get(VIEW_COOKIE)?.value;
  const pref: ViewPreference = raw === "mobile" || raw === "desktop" ? raw : null;
  const mobile = wantsMobile(pref, req.headers.get("user-agent"));

  if (target && mobile) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    const res = NextResponse.rewrite(url);
    res.headers.set("Vary", "User-Agent, Cookie");
    return res;
  }
  if (pathname === "/more") return NextResponse.redirect(new URL("/", req.url));

  const res = NextResponse.next();
  if (target) res.headers.set("Vary", "User-Agent, Cookie");
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const customerPage = !pathname.startsWith("/api/") && !pathname.startsWith("/admin");
  if (!on()) return customerPage ? phoneRouting(req) : NextResponse.next();

  const key = (process.env.MAINTENANCE_BYPASS_KEY ?? "").trim();
  const { searchParams } = req.nextUrl;

  if (key.length >= 8) {
    const offered = searchParams.get("preview");
    if (offered !== null) {
      const clean = req.nextUrl.clone();
      clean.searchParams.delete("preview");
      const res = NextResponse.redirect(clean);
      res.headers.set("Cache-Control", "no-store");
      if (offered === "off") {
        res.cookies.delete(COOKIE);
      } else if (sameKey(offered, key)) {
        res.cookies.set(COOKIE, key, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: HALF_DAY,
        });
      }
      return res;
    }
    if (sameKey(req.cookies.get(COOKIE)?.value ?? "", key)) return customerPage ? phoneRouting(req) : NextResponse.next();
  }

  const headers = { "Retry-After": "3600", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "The site is under development. Please try again later." }, { status: 503, headers });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  const res = NextResponse.rewrite(url, { status: 503 });
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

export const config = {
  // Skip build files and public images so the holding page can still load its styles and logo.
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico).*)"],
};
