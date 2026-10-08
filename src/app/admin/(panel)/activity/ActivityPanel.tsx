"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api";
import { clock, dayDate } from "../../ui";

interface Entry {
  id: number;
  created_at: string;
  admin_email: string;
  action: string;
  target: string | null;
  detail: unknown;
}

type Group = "signin" | "orders" | "products" | "offers" | "content" | "shop" | "admins";
const GROUPS: { id: Group; label: string }[] = [
  { id: "signin", label: "Sign-in" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products and prices" },
  { id: "offers", label: "Offers" },
  { id: "content", label: "Content" },
  { id: "shop", label: "Shop" },
  { id: "admins", label: "Admins" },
];
const GROUP_OF: Record<string, Group> = {
  login: "signin", login_failed: "signin", logout: "signin", logout_everywhere: "signin", mfa_enabled: "signin", mfa_disabled: "signin",
  order_status: "orders", bill_printed: "orders", number_blocked: "orders", number_unblocked: "orders",
  product_created: "products", product_updated: "products", product_deleted: "products", prices_changed: "products", products_imported: "products",
  offers_changed: "offers",
  content_changed: "content", policy_changed: "content", business_changed: "content",
  shop_open: "shop", shop_closed: "shop", hours_changed: "shop",
  admin_added: "admins", admin_removed: "admins",
};

type Change = { name: string; from?: number | string; to?: number | string };

/** One plain sentence per entry: who did what. */
function sentence(e: Entry): string {
  const who = e.admin_email;
  const d = e.detail as { changes?: Change[]; removed?: boolean; reset?: boolean; percent?: number } | null;
  const t = e.target ?? "";
  switch (e.action) {
    case "login": return `${who} signed in${t ? ` (${t})` : ""}`;
    case "login_failed": return `A sign-in as ${who} failed${t ? `: ${t}` : ""}`;
    case "logout": return `${who} signed out`;
    case "logout_everywhere": return `${who} signed out of all devices`;
    case "mfa_enabled": return `${who} turned on two-step login`;
    case "mfa_disabled": return `${who} turned off two-step login`;
    case "shop_open": return `${who} resumed orders`;
    case "shop_closed": return `${who} paused orders${t ? `: “${t}”` : ""}`;
    case "hours_changed": return `${who} changed the opening hours`;
    case "product_created": return `${who} added the product ${t}`;
    case "product_updated": return `${who} edited the product ${t}`;
    case "product_deleted": return `${who} deleted the product ${t}`;
    case "products_imported": return `${who} imported ${t || "the default products"}`;
    case "prices_changed":
      if (d?.changes?.length)
        return `${who} ${d.changes.length === 1 ? `changed ${d.changes[0].name} from ${d.changes[0].from} to ${d.changes[0].to}` : `made ${d.changes.length} price or stock changes (${d.changes.slice(0, 2).map((c) => `${c.name}: ${c.from} → ${c.to}`).join("; ")}${d.changes.length > 2 ? "; …" : ""})`}`;
      return `${who} changed prices or stock${t ? ` (${t})` : ""}`;
    case "order_status":
      return d?.changes?.length ? `${who} moved order ${d.changes[0].name} from ${d.changes[0].from} to ${d.changes[0].to}` : `${who} changed order ${t}`;
    case "bill_printed": return `${who} opened the bill for order ${t}`;
    case "number_blocked": return `${who} blocked the number ${t}`;
    case "number_unblocked": return `${who} unblocked the number ${t}`;
    case "offers_changed": return d?.removed ? `${who} removed offers (${t})` : `${who} changed offers (${t}${d?.percent ? `, ${d.percent}% off` : ""})`;
    case "content_changed": return `${who} edited website content${t ? ` (${t.replace(":", ": ")})` : ""}`;
    case "policy_changed": return d?.reset ? `${who} reset the ${t} policy to the built-in text` : `${who} edited the ${t} policy`;
    case "business_changed": return `${who} changed the business and delivery details`;
    case "admin_added": return `${who} added the admin ${t}`;
    case "admin_removed": return `${who} removed the admin ${t}`;
    default: return `${who}: ${e.action}${t ? ` ${t}` : ""}`;
  }
}

/** Where a target points, when it points anywhere. */
function link(e: Entry): { href: string; label: string } | null {
  switch (GROUP_OF[e.action]) {
    case "orders": return e.action === "number_blocked" || e.action === "number_unblocked" ? { href: "/admin/settings", label: "Blocked numbers" } : { href: "/admin/history", label: "Order history" };
    case "products": return { href: "/admin/products", label: "Products" };
    case "offers": return { href: "/admin/offers", label: "Offers" };
    case "content": return { href: "/admin/content", label: "Content" };
    case "shop": return { href: "/admin/settings", label: "Shop settings" };
    case "admins": return { href: "/admin/admins", label: "Admins" };
    default: return null;
  }
}

export default function ActivityPanel() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<Group | "all">("all");
  const [person, setPerson] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminApi("/api/admin/audit")
      .then((d) => setEntries(d.entries))
      .catch((e) => {
        setError((e as Error).message);
        setEntries([]);
      });
  }, []);

  const people = useMemo(() => [...new Set((entries ?? []).map((e) => e.admin_email))].sort(), [entries]);
  const shown = (entries ?? []).filter((e) => (group === "all" || GROUP_OF[e.action] === group) && (person === "all" || e.admin_email === person) && (!query.trim() || sentence(e).toLowerCase().includes(query.trim().toLowerCase())));
  const chip = (on: boolean) => `min-h-12 whitespace-nowrap rounded-full border px-4 text-base font-medium ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text"}`;
  const today = new Date().toDateString();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl sm:text-3xl">Activity log</h1>
      <p className="mb-4 text-base text-secondary-text">Showing the latest 300 actions.</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by any word" aria-label="Search" className="min-h-12 min-w-[12rem] flex-1 rounded-full border border-warm-gray bg-white px-4 text-base outline-none focus:border-accent" />
        <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person" className="min-h-12 rounded-full border border-warm-gray bg-white px-4 text-base">
          <option value="all">Everyone</option>
          {people.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto" role="group" aria-label="Type">
        <button onClick={() => setGroup("all")} aria-pressed={group === "all"} className={chip(group === "all")}>Everything</button>
        {GROUPS.map((g) => <button key={g.id} onClick={() => setGroup(g.id)} aria-pressed={group === g.id} className={chip(group === g.id)}>{g.label}</button>)}
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {entries === null ? (
        <p className="text-base text-secondary-text">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-warm-gray bg-white p-8 text-center text-base text-secondary-text">{entries.length === 0 ? "Nothing here yet." : "Nothing matches these filters."}</p>
      ) : (
        <ul className="divide-y divide-warm-gray overflow-hidden rounded-2xl border border-warm-gray bg-white">
          {shown.map((e) => {
            const l = link(e);
            const failed = e.action === "login_failed";
            return (
              <li key={e.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-3 text-base">
                {failed && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-700">Failed</span>}
                <span className="min-w-0 flex-1 basis-60 break-words">
                  {sentence(e)}
                  {l && <> · <a href={l.href} className="text-accent hover:underline">{l.label}</a></>}
                </span>
                <time className="whitespace-nowrap text-sm text-secondary-text" dateTime={e.created_at}>
                  {new Date(e.created_at).toDateString() === today ? `${clock(e.created_at)} today` : `${dayDate(e.created_at)}, ${clock(e.created_at)}`}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
