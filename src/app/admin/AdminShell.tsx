"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  History,
  IndianRupee,
  MessageSquareHeart,
  Tag,
  LayoutDashboard,
  LogOut,
  Menu,
  FileText,
  Package,
  Settings,
  ShieldCheck,
  Store,
  ScrollText,
  X,
} from "lucide-react";
import { shopNow, type OpeningHours } from "@/lib/hours";
import { adminApi } from "./api";
import { usePoll } from "./usePoll";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Live orders", icon: ClipboardList, badge: true },
  { href: "/admin/history", label: "Order history", icon: History },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/prices", label: "Update prices", icon: IndianRupee },
  { href: "/admin/offers", label: "Offers", icon: Tag },
  { href: "/admin/sales", label: "Sales", icon: BarChart3 },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart },
  { href: "/admin/content", label: "Website content", icon: FileText },
  { href: "/admin/settings", label: "Shop settings", icon: Settings },
  { href: "/admin/activity", label: "Activity log", icon: ScrollText },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
] as const;

interface Summary {
  newOrders: number;
  shop: { open: boolean; message: string };
  hours: OpeningHours;
}

export const SHOP_CHANGED_EVENT = "kg-shop-changed";

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSummary(await adminApi("/api/admin/summary"));
    } catch {
      /* the page itself reports errors */
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(SHOP_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SHOP_CHANGED_EVENT, refresh);
  }, [refresh]);
  usePoll(refresh, 30000);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function toggleShop() {
    if (!summary || toggling) return;
    const open = !summary.shop.open;
    if (!open && !window.confirm("Pause orders? Customers will not be able to order until you switch this back.")) return;
    setToggling(true);
    try {
      const { shop } = await adminApi("/api/admin/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open, message: summary.shop.message }),
      });
      setSummary({ ...summary, shop });
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
    } catch (e) {
      window.alert((e as Error).message);
    }
    setToggling(false);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  // What customers get right now: the opening hours AND the pause switch.
  const live = summary ? shopNow(summary.hours, summary.shop) : null;
  const shopOpen = live?.open;

  const sidebar = (
    <nav className="flex h-full flex-col gap-5 p-4" aria-label="Admin navigation">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg leading-tight">KG Foods</p>
          <p className="text-xs text-secondary-text">Admin</p>
        </div>
        <button
          className="lg:hidden p-2 -mr-2 rounded-full hover:bg-warm-gray"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Open / closed switch: always one tap away */}
      <button
        onClick={toggleShop}
        disabled={!summary || toggling}
        aria-pressed={!!summary?.shop.open}
        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors disabled:opacity-60 ${
          shopOpen === undefined
            ? "border-warm-gray bg-white"
            : shopOpen
              ? "border-success/30 bg-success/10"
              : "border-red-300 bg-red-50"
        }`}
      >
        <Store size={18} className={shopOpen ? "text-success" : "text-red-600"} />
        <span className="flex-1">
          <span className="block text-sm font-semibold">
            {live === null ? "Shop status…" : live.open ? "Shop is open" : live.reason === "paused" ? "Orders paused" : "Shop is closed"}
          </span>
          <span className="block text-xs text-secondary-text">
            {live === null ? "" : live.reason === "paused" ? "Tap to resume" : live.open ? `Closes ${live.closesAt} · tap to pause` : `${live.label} · tap to pause`}
          </span>
        </span>
        <span
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${shopOpen ? "bg-success" : "bg-red-400"}`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${shopOpen ? "left-[1.375rem]" : "left-0.5"}`}
          />
        </span>
      </button>

      <ul className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, ...rest }) => {
          const badge = "badge" in rest && rest.badge ? summary?.newOrders ?? 0 : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-accent text-white"
                    : "text-secondary-text hover:bg-warm-gray/60 hover:text-primary-text"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive(href) ? "bg-white text-accent" : "bg-accent text-white"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto space-y-1 border-t border-warm-gray pt-3 text-sm">
        <p className="truncate px-3 text-xs text-secondary-text">{email}</p>
        <a href="/shop" className="block rounded-xl px-3 py-2 text-secondary-text hover:bg-warm-gray/60">
          View shop ↗
        </a>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-secondary-text hover:bg-warm-gray/60"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Phone / tablet top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-warm-gray bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(true)} className="relative -ml-2 p-2 rounded-full hover:bg-warm-gray" aria-label="Open menu">
            <Menu size={22} />
            {(summary?.newOrders ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
            )}
          </button>
          <span className="font-display text-lg">KG Foods Admin</span>
        </div>
        {shopOpen !== undefined && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shopOpen ? "bg-success/10 text-success" : "bg-red-100 text-red-700"}`}>
            {shopOpen ? "Open" : "Closed"}
          </span>
        )}
      </header>

      {/* Left sidebar: fixed column on desktop, slide-over on phones */}
      <aside className="hidden lg:block lg:order-first">
        <div className="sticky top-0 h-screen overflow-y-auto border-r border-warm-gray bg-white">{sidebar}</div>
      </aside>
      {menuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-hover">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0 px-4 py-5 sm:px-6 lg:order-last lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
