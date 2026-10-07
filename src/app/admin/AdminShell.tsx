"use client";

import { isOwner } from "@/lib/owner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  History,
  Home,
  IndianRupee,
  MessageSquareHeart,
  Tag,
  LogOut,
  Menu,
  FileText,
  Package,
  PauseCircle,
  Settings,
  ShieldCheck,
  Users,
  ScrollText,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { shopNow, type OpeningHours } from "@/lib/hours";
import { adminApi } from "./api";
import { SHOP_CHANGED_EVENT, UiProvider, useUi } from "./ui";
import { usePoll } from "./usePoll";

export { SHOP_CHANGED_EVENT };

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
  ownerOnly?: boolean;
}

// Five labelled groups. They are headings, not folding menus: nothing hides behind a tap.
const GROUPS: { name: string; items: NavItem[] }[] = [
  {
    name: "Orders",
    items: [
      { href: "/admin", label: "Today", icon: Home },
      { href: "/admin/orders", label: "Live orders", icon: ClipboardList, badge: true },
      { href: "/admin/history", label: "Order history", icon: History },
    ],
  },
  {
    name: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/prices", label: "Update prices", icon: IndianRupee },
      { href: "/admin/offers", label: "Offers", icon: Tag },
    ],
  },
  {
    name: "Insights",
    items: [
      { href: "/admin/sales", label: "Sales", icon: BarChart3 },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart },
    ],
  },
  {
    name: "Shop",
    items: [
      { href: "/admin/settings", label: "Shop settings", icon: Settings },
      { href: "/admin/content", label: "Website content", icon: FileText },
    ],
  },
  {
    name: "Account",
    items: [
      { href: "/admin/security", label: "Security", icon: ShieldCheck },
      { href: "/admin/activity", label: "Activity log", icon: ScrollText },
      { href: "/admin/admins", label: "Admins", icon: Users, ownerOnly: true },
    ],
  },
];

// The four daily screens in the phone's bottom bar, plus More.
const TABS: { href: string; label: string; icon: LucideIcon; badge?: boolean }[] = [
  { href: "/admin", label: "Today", icon: Home },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, badge: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/prices", label: "Prices", icon: IndianRupee },
];

const PRESETS = [
  "Back in 30 minutes.",
  "Sold out for today. Fresh stock arrives tomorrow morning.",
  "Closed for the festival. We'll be back soon!",
  "Not taking new orders right now. Please call us.",
];

interface Summary {
  newOrders: number;
  shop: { open: boolean; message: string };
  hours: OpeningHours;
}

const COLLAPSE_KEY = "kg-admin-sidebar-collapsed";

export default function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <UiProvider>
      <Shell email={email}>{children}</Shell>
    </UiProvider>
  );
}

function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useUi();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failures, setFailures] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lastNew = useRef<number | null>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* private mode: stay expanded */
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const refresh = useCallback(async () => {
    try {
      const s: Summary = await adminApi("/api/admin/summary");
      setSummary(s);
      setFailures(0);
    } catch {
      setFailures((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(SHOP_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SHOP_CHANGED_EVENT, refresh);
  }, [refresh]);
  usePoll(refresh, 30000);

  useEffect(() => {
    setMoreOpen(false);
    setPillOpen(false);
  }, [pathname]);

  // A new order is announced wherever the person is (the board does its own alert).
  useEffect(() => {
    if (!summary) return;
    const n = summary.newOrders;
    if (lastNew.current !== null && n > lastNew.current && !pathname.startsWith("/admin/orders")) {
      toast({ text: `${n} new order${n === 1 ? "" : "s"} waiting`, action: { label: "View", href: "/admin/orders" }, ms: 8000 });
    }
    lastNew.current = n;
  }, [summary, pathname, toast]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const visibleGroups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.ownerOnly || isOwner(email)) }));
  const current = visibleGroups.flatMap((g) => g.items).find((i) => isActive(i.href));
  const newOrders = summary?.newOrders ?? 0;
  const live = summary ? shopNow(summary.hours, summary.shop) : null;

  const navList = (compact: boolean) => (
    <div className="flex flex-col gap-4">
      {visibleGroups.map((g) => (
        <div key={g.name}>
          {!compact && <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-secondary-text">{g.name}</p>}
          {compact && <div className="mx-3 mb-1 border-t border-warm-gray" aria-hidden="true" />}
          <ul className="flex flex-col gap-1">
            {g.items.map(({ href, label, icon: Icon, badge }) => {
              const count = badge ? newOrders : 0;
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={compact ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors ${compact ? "justify-center" : ""} ${
                      active ? "bg-accent/10 text-accent" : "text-primary-text hover:bg-warm-gray/60"
                    }`}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-accent" aria-hidden="true" />}
                    <Icon size={20} className="flex-shrink-0" />
                    {!compact && <span className="flex-1">{label}</span>}
                    {count > 0 && (
                      <span className={`rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white ${compact ? "absolute right-1 top-1" : ""}`}>{count}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  const account = (compact: boolean) => (
    <div className="space-y-1 border-t border-warm-gray pt-3 text-base">
      {!compact && <p className="truncate px-3 text-sm text-secondary-text">{email}</p>}
      <a href="/shop" target="_blank" rel="noopener" className={`flex min-h-12 items-center rounded-lg px-3 text-secondary-text hover:bg-warm-gray/60 ${compact ? "justify-center" : ""}`} title="View shop">
        {compact ? "↗" : "View shop ↗"}
      </a>
      <button onClick={logout} className={`flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-left text-secondary-text hover:bg-warm-gray/60 ${compact ? "justify-center" : ""}`} title="Log out">
        <LogOut size={18} /> {!compact && "Log out"}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen lg:grid ${collapsed ? "lg:grid-cols-[4rem_minmax(0,1fr)]" : "lg:grid-cols-[15rem_minmax(0,1fr)]"}`}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 flex h-screen flex-col gap-4 overflow-y-auto border-r border-warm-gray bg-white p-3">
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
            {!collapsed && (
              <div>
                <p className="font-display text-lg leading-tight">KG Foods</p>
                <p className="text-sm text-secondary-text">Admin</p>
              </div>
            )}
            <button onClick={toggleCollapsed} aria-label={collapsed ? "Expand menu" : "Shrink menu"} className="flex h-12 w-12 items-center justify-center rounded-lg text-secondary-text hover:bg-warm-gray/60">
              {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </button>
          </div>
          {!collapsed && <StatusPill live={live} open={pillOpen} setOpen={setPillOpen} summary={summary} onChanged={refresh} />}
          <nav aria-label="Admin navigation" className="flex-1">{navList(collapsed)}</nav>
          {account(collapsed)}
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        {/* Phone top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-warm-gray bg-background/95 px-4 backdrop-blur lg:hidden">
          <h1 className="truncate font-display text-xl">{current?.label ?? "KG Foods Admin"}</h1>
          <StatusPill live={live} open={pillOpen} setOpen={setPillOpen} summary={summary} onChanged={refresh} small />
        </header>

        {failures >= 3 && (
          <p role="alert" className="flex items-center gap-2 bg-red-600 px-4 py-2 text-base text-white">
            <WifiOff size={18} /> Not connected. Orders are not updating.
          </p>
        )}

        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>

      {/* Phone bottom bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-warm-gray bg-white lg:hidden">
        {TABS.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`relative flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? "text-accent" : "text-secondary-text"}`}>
              <span className="relative">
                <Icon size={22} />
                {badge && newOrders > 0 && (
                  <span className="absolute -right-3 -top-2 min-w-[1.25rem] rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-5 text-white">{newOrders}</span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
        <button onClick={() => setMoreOpen(true)} className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${moreOpen ? "text-accent" : "text-secondary-text"}`}>
          <Menu size={22} />
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="All screens">
          <div className="flex h-14 items-center justify-between border-b border-warm-gray px-4">
            <h2 className="font-display text-xl">All screens</h2>
            <button onClick={() => setMoreOpen(false)} aria-label="Close menu" className="-mr-2 flex h-12 w-12 items-center justify-center rounded-full hover:bg-warm-gray">
              <X size={22} />
            </button>
          </div>
          <div className="space-y-4 p-4 pb-10">
            {navList(false)}
            {account(false)}
          </div>
        </div>
      )}
    </div>
  );
}

/** Always says the real status in words, and opens a small panel to pause or resume. */
function StatusPill({
  live,
  summary,
  open,
  setOpen,
  onChanged,
  small,
}: {
  live: ReturnType<typeof shopNow> | null;
  summary: Summary | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  onChanged: () => void;
  small?: boolean;
}) {
  const { toast } = useUi();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && summary) setMessage(summary.shop.message ?? "");
  }, [open, summary]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open, setOpen]);

  const paused = live?.reason === "paused";
  const label = !live
    ? "Checking…"
    : live.open
      ? `Open · closes ${live.closesAt}`
      : paused
        ? "Orders paused"
        : live.opensLabel
          ? `Closed · opens ${live.opensLabel.replace("tomorrow at", "tomorrow")}`
          : "Closed";
  const dot = !live ? "bg-warm-gray" : live.open ? "bg-success" : paused ? "bg-amber-500" : "bg-gray-400";

  async function put(open: boolean, msg: string) {
    return adminApi("/api/admin/shop", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open, message: msg }),
    });
  }

  async function change(toOpen: boolean) {
    if (!summary || busy) return;
    const before = summary.shop;
    setBusy(true);
    try {
      await put(toOpen, toOpen ? before.message : message.trim());
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
      setOpen(false);
      toast({
        text: toOpen ? "Orders resumed." : "Orders paused.",
        undo: async () => {
          try {
            await put(before.open, before.message);
            window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
          } catch (e) {
            toast({ text: (e as Error).message, tone: "error" });
          }
        },
      });
    } catch (e) {
      toast({ text: `Could not change the shop status. ${(e as Error).message}`, tone: "error", retry: () => change(toOpen) });
    }
    setBusy(false);
    onChanged();
  }

  const sentence = !live ? "" : live.open ? `Orders are open. ${live.message}` : paused ? "Orders are paused." : `The shop is closed. ${live.message}`;

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex min-h-12 w-full items-center gap-2 rounded-full border border-warm-gray bg-white px-4 text-left font-medium hover:bg-cream ${small ? "text-sm" : "text-base"}`}
      >
        <span className={`h-3 w-3 flex-shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        {paused && <PauseCircle size={16} className="flex-shrink-0 text-amber-600" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </button>

      {open && summary && live && (
        <div role="dialog" aria-label="Shop status" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-warm-gray bg-white p-4 shadow-hover lg:left-0 lg:right-auto">
          <p className="flex items-start gap-2 text-base font-medium">
            <Clock size={18} className="mt-0.5 flex-shrink-0 text-secondary-text" /> {sentence}
          </p>

          {paused ? (
            <>
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-base text-amber-900">
                Customers see: “{summary.shop.message || "Orders are paused right now. Please check back soon."}”
              </p>
              <button onClick={() => change(true)} disabled={busy} className="btn-primary mt-4 min-h-12 w-full !text-base disabled:opacity-60">
                {busy ? "Working…" : "Resume orders"}
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-semibold">Message customers will see</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setMessage(p)}
                    className={`min-h-12 rounded-full border px-3 text-left text-sm ${message === p ? "border-accent bg-accent/10" : "border-warm-gray"}`}
                  >
                    {p.length > 30 ? p.slice(0, 30) + "…" : p}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Or write your own message"
                className="mt-2 w-full rounded-xl border border-warm-gray px-3 py-2 text-base outline-none focus:border-accent"
              />
              <button onClick={() => change(false)} disabled={busy} className="mt-3 min-h-12 w-full rounded-full bg-amber-500 px-6 text-base font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                {busy ? "Working…" : "Pause orders"}
              </button>
            </>
          )}
          <Link href="/admin/settings" className="mt-3 flex min-h-12 items-center justify-center gap-2 text-base text-accent hover:underline">
            <CalendarClock size={16} /> Opening hours and settings
          </Link>
        </div>
      )}
    </div>
  );
}
