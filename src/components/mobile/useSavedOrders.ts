"use client";

import { useEffect, useState } from "react";
import { fetchStatuses, readSavedOrders, type SavedOrder, type SavedStatus } from "./orderStatus";

/** Orders saved on this phone with their live status, refreshed every 30s while the page is visible. */
export function useSavedOrders() {
  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [status, setStatus] = useState<Record<string, SavedStatus>>({});

  useEffect(() => {
    const list = readSavedOrders();
    setOrders(list);
    if (!list.length) return;
    let live = true;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      const s = await fetchStatuses(list.map((o) => o.id));
      if (live) setStatus((cur) => ({ ...cur, ...s }));
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  return { orders, status };
}
