"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../api";

interface Entry {
  id: number;
  created_at: string;
  admin_email: string;
  action: string;
  target: string | null;
  detail: unknown;
}

const LABEL: Record<string, { text: string; tone: "normal" | "warn" | "bad" }> = {
  login: { text: "Signed in", tone: "normal" },
  login_failed: { text: "Failed sign-in", tone: "bad" },
  logout: { text: "Signed out", tone: "normal" },
  logout_everywhere: { text: "Signed out everywhere", tone: "warn" },
  mfa_enabled: { text: "Turned on two-step login", tone: "normal" },
  mfa_disabled: { text: "Turned off two-step login", tone: "warn" },
  shop_open: { text: "Opened the shop", tone: "normal" },
  shop_closed: { text: "Closed the shop", tone: "warn" },
  product_created: { text: "Added a product", tone: "normal" },
  product_updated: { text: "Edited a product", tone: "normal" },
  product_deleted: { text: "Deleted a product", tone: "warn" },
  prices_changed: { text: "Changed prices / stock", tone: "normal" },
  products_imported: { text: "Imported default products", tone: "normal" },
  order_status: { text: "Changed an order", tone: "normal" },
  number_blocked: { text: "Blocked a number", tone: "warn" },
  number_unblocked: { text: "Unblocked a number", tone: "normal" },
  content_changed: { text: "Edited website content", tone: "normal" },
  policy_changed: { text: "Edited a policy page", tone: "warn" },
  hours_changed: { text: "Changed opening hours", tone: "normal" },
  offers_changed: { text: "Changed offers", tone: "normal" },
  bill_printed: { text: "Printed a bill", tone: "normal" },
  business_changed: { text: "Changed business / delivery details", tone: "warn" },
};
const TONE = { normal: "bg-warm-gray text-secondary-text", warn: "bg-amber-100 text-amber-800", bad: "bg-red-100 text-red-700" };

function summary(e: Entry): string {
  const d = e.detail as { changes?: { name: string; from?: number | string; to?: number | string }[] } | null;
  if (d?.changes?.length) {
    return d.changes.map((c) => `${c.name}: ${c.from} → ${c.to}`).join(" · ");
  }
  return e.target ?? "";
}

export default function ActivityPanel() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");
  const [only, setOnly] = useState<"all" | "prices" | "security">("all");

  useEffect(() => {
    adminApi("/api/admin/audit")
      .then((d) => setEntries(d.entries))
      .catch((e) => {
        setError((e as Error).message);
        setEntries([]);
      });
  }, []);

  const shown = (entries ?? []).filter((e) =>
    only === "all"
      ? true
      : only === "prices"
        ? ["prices_changed", "product_created", "product_updated", "product_deleted", "products_imported"].includes(e.action)
        : /login|logout|mfa|number_/.test(e.action)
  );

  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-xs font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl sm:text-3xl">Activity log</h1>
      <p className="mb-4 text-sm text-secondary-text">Who did what in the admin panel (latest 300 actions).</p>

      <div className="mb-3 flex gap-2">
        <button onClick={() => setOnly("all")} className={chip(only === "all")}>Everything</button>
        <button onClick={() => setOnly("prices")} className={chip(only === "prices")}>Products & prices</button>
        <button onClick={() => setOnly("security")} className={chip(only === "security")}>Sign-ins & security</button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {entries === null ? (
        <p className="text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-warm-gray bg-white p-8 text-center text-secondary-text">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-warm-gray overflow-hidden rounded-2xl border border-warm-gray bg-white">
          {shown.map((e) => {
            const l = LABEL[e.action] ?? { text: e.action, tone: "normal" as const };
            return (
              <li key={e.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[l.tone]}`}>{l.text}</span>
                <span className="min-w-0 flex-1 basis-48 break-words">
                  {summary(e) && <span className="block">{summary(e)}</span>}
                  <span className="text-xs text-secondary-text">{e.admin_email}</span>
                </span>
                <time className="whitespace-nowrap text-xs text-secondary-text" dateTime={e.created_at}>
                  {new Date(e.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
