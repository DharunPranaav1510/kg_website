"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopNow, type OpeningHours } from "@/lib/hours";
import { formatPhone } from "@/lib/phone";
import { adminApi } from "../../api";
import { SHOP_CHANGED_EVENT, dayDate, useUi } from "../../ui";
import CustomerView from "./CustomerView";
import HoursEditor from "./HoursEditor";

const PRESETS = [
  "Back in 30 minutes.",
  "Sold out for today. Fresh stock arrives tomorrow morning.",
  "Closed for the festival. We'll be back soon!",
  "Not taking new orders right now. Please call us.",
];

interface Blocked {
  phone: string;
  reason: string | null;
  created_at: string;
}

type Tab = "orders" | "hours" | "blocked";
const TABS: { id: Tab; label: string }[] = [
  { id: "orders", label: "Orders on or off" },
  { id: "hours", label: "Opening hours" },
  { id: "blocked", label: "Blocked numbers" },
];

export default function SettingsPanel() {
  const { toast, confirm } = useUi();
  const [tab, setTab] = useState<Tab>("orders");
  const [follow, setFollow] = useState<boolean | null>(null); // true = follow opening hours
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState({ open: true, message: "" });
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([adminApi("/api/admin/summary"), adminApi("/api/admin/blocked")]);
      setFollow(s.shop.open);
      setMessage(s.shop.message);
      setSaved(s.shop);
      setHours(s.hours);
      setBlocked(b.blocked);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const dirty = follow !== null && (follow !== saved.open || (!follow && message.trim() !== saved.message));
  const savedStatus = useMemo(() => (hours ? shopNow(hours, saved) : null), [hours, saved]);
  const draftStatus = useMemo(() => (hours && follow !== null ? shopNow(hours, { open: follow, message: message.trim() }) : null), [hours, follow, message]);

  async function save() {
    if (follow === null) return;
    if (!follow && saved.open) {
      const r = await confirm({ title: "Pause orders?", body: `Customers will see: “${message.trim() || "Orders are paused right now. Please check back soon."}” They cannot order until you switch back.`, confirmLabel: "Pause orders", cancelLabel: "Keep taking orders", danger: true });
      if (r.choice !== "confirm") return;
    }
    setBusy(true);
    setError("");
    const before = saved;
    try {
      const { shop } = await adminApi("/api/admin/shop", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ open: follow, message: message.trim() }) });
      setSaved(shop);
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
      toast({
        text: shop.open ? "Orders follow the opening hours." : "Orders are paused.",
        undo: async () => {
          try {
            await adminApi("/api/admin/shop", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(before) });
            window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
            await load();
          } catch (e) {
            toast({ text: (e as Error).message, tone: "error" });
          }
        },
      });
    } catch (e) {
      setError((e as Error).message);
      toast({ text: `Could not save. ${(e as Error).message}`, tone: "error", retry: save });
    }
    setBusy(false);
  }

  async function block() {
    setError("");
    try {
      await adminApi("/api/admin/blocked", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: newPhone, reason: reason.trim() || "Added manually" }) });
      setNewPhone("");
      setReason("");
      toast({ text: "This number can no longer place orders." });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function unblock(b: Blocked) {
    try {
      await adminApi(`/api/admin/blocked?phone=${encodeURIComponent(b.phone)}`, { method: "DELETE" });
      toast({
        text: `${formatPhone(b.phone)} unblocked.`,
        undo: async () => {
          await adminApi("/api/admin/blocked", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: b.phone, reason: b.reason ?? "" }) });
          await load();
        },
      });
      await load();
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
    }
  }

  const choice = (on: boolean, color: string) => `min-h-[5.5rem] rounded-2xl border-2 p-4 text-left transition-colors ${on ? color : "border-warm-gray bg-white hover:bg-cream"}`;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="font-display text-2xl sm:text-3xl">Shop settings</h1>

      <div className="flex gap-2 overflow-x-auto border-b border-warm-gray" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`-mb-px min-h-12 whitespace-nowrap border-b-2 px-4 text-base font-medium ${tab === t.id ? "border-accent text-accent" : "border-transparent text-secondary-text hover:text-primary-text"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {tab === "orders" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <p className="text-xl font-semibold" aria-live="polite">
              {savedStatus ? (savedStatus.open ? `Shop is open, closes ${savedStatus.closesAt}.` : savedStatus.reason === "paused" ? "Orders are paused." : `Shop is closed${savedStatus.opensLabel ? `, opens ${savedStatus.opensLabel}` : ""}.`) : "Checking…"}
            </p>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Orders on or off">
              <button role="radio" aria-checked={follow === true} onClick={() => setFollow(true)} className={choice(follow === true, "border-success bg-success/10")}>
                <span className="block text-lg font-semibold">Follow opening hours</span>
                <span className="block text-sm text-secondary-text">Orders open and close by themselves.</span>
              </button>
              <button role="radio" aria-checked={follow === false} onClick={() => setFollow(false)} className={choice(follow === false, "border-amber-500 bg-amber-50")}>
                <span className="block text-lg font-semibold">Pause orders now</span>
                <span className="block text-sm text-secondary-text">No orders until you switch back.</span>
              </button>
            </div>
            <p className="text-base text-secondary-text">Pause overrides the timetable until you switch back.</p>

            {follow === false && (
              <div className="rounded-2xl border border-warm-gray bg-white p-4">
                <p className="mb-2 text-base font-semibold">Message customers will see</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button key={p} onClick={() => setMessage(p)} aria-pressed={message === p} className={`min-h-12 rounded-full border px-4 text-left text-base ${message === p ? "border-accent bg-accent/10" : "border-warm-gray"}`}>{p}</button>
                  ))}
                </div>
                <textarea rows={2} maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Or write your own message" aria-label="Message for customers" className="mt-3 w-full rounded-xl border border-warm-gray px-3 py-2 text-base outline-none focus:border-accent" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={save} disabled={busy || !dirty} className="btn-primary min-h-12 !px-8 !text-base disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
              {dirty && <button onClick={() => { setFollow(saved.open); setMessage(saved.message); }} className="min-h-12 px-3 text-base text-secondary-text underline">Discard</button>}
            </div>
            <p className="text-base text-secondary-text">Orders already received keep going. Customers can still browse while orders are paused or the shop is closed.</p>
          </div>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            {savedStatus && <CustomerView status={dirty && draftStatus ? draftStatus : savedStatus} title={dirty ? "What customers will see after you save" : "What customers see right now"} />}
          </aside>
        </div>
      )}

      {tab === "hours" && <HoursEditor manual={saved} />}

      {tab === "blocked" && (
        <section className="rounded-2xl border border-warm-gray bg-white p-4">
          <p className="mb-3 text-base font-medium">Blocked numbers cannot place orders.</p>
          <p className="mb-4 text-base text-secondary-text">Use this for fake or abusive orders. You can also block a number from any order.</p>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input type="tel" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10-digit mobile number" aria-label="Phone number" className="min-h-12 rounded-xl border border-warm-gray px-4 text-base outline-none focus:border-accent" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Reason (optional)" aria-label="Reason" className="min-h-12 rounded-xl border border-warm-gray px-4 text-base outline-none focus:border-accent" />
            <button onClick={block} disabled={!newPhone.trim()} className="btn-primary min-h-12 !text-base disabled:opacity-50">Block number</button>
          </div>
          {blocked.length === 0 ? (
            <p className="text-base text-secondary-text">No blocked numbers.</p>
          ) : (
            <ul className="divide-y divide-warm-gray/70">
              {blocked.map((b) => (
                <li key={b.phone} className="flex flex-wrap items-center gap-3 py-2 text-base">
                  <span className="font-semibold tabular-nums">{formatPhone(b.phone)}</span>
                  <span className="min-w-0 flex-1 truncate text-secondary-text">{b.reason}</span>
                  <span className="text-sm text-secondary-text">{dayDate(b.created_at)}</span>
                  <button onClick={() => unblock(b)} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Unblock</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
