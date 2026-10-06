"use client";

import { useEffect } from "react";

/**
 * Backup for phone detection. A narrow screen on the full site is sent to the app layout,
 * and a wide screen on the app layout goes back to the full site. Only runs when the visitor
 * has not picked a version themselves, and only once per browser session so it can never loop.
 */
export default function AutoView() {
  useEffect(() => {
    try {
      if (document.cookie.includes("kg_view=") || sessionStorage.getItem("kg-auto-view")) return;
      const onApp = !!document.querySelector(".kg-mobile");
      const path = window.location.pathname;
      if (path.startsWith("/admin")) return;
      const w = window.innerWidth;
      const want = !onApp && w <= 640 ? "mobile" : onApp && w >= 1024 ? "desktop" : null;
      if (!want) return;
      sessionStorage.setItem("kg-auto-view", "1");
      const url = new URL(window.location.href);
      url.searchParams.set("view", want);
      url.searchParams.set("auto", "1");
      window.location.replace(url.toString());
    } catch {
      /* storage blocked: skip */
    }
  }, []);
  return null;
}
