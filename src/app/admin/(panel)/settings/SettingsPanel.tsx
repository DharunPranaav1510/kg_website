"use client";

import { useCallback, useEffect, useState } from "react";
import HoursEditor from "./HoursEditor";
import { formatPhone } from "@/lib/phone";
import { adminApi } from "../../api";
import { SHOP_CHANGED_EVENT } from "../../AdminShell";

const PRESETS = [
  "We're closed for today. Back tomorrow at 6:30 AM.",
  "Sold out for today. Fresh stock arrives tomorrow morning.",
  "Closed for the festival. We'll be back soon!",
  "Not taking new orders right now. Please call us.",
];

interface Blocked {
  phone: string;
  reason: string | null;
  created_at: string;
}

export default function SettingsPanel() {
  const [open, setOpen] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState({ open: true, message: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [newPhone, setNewPhone] = useState("");

  const load = useCallback(async () => {
    try {
      const [{ shop }, { blocked }] = await Promise.all([adminApi("/api/admin/shop"), adminApi("/api/admin/blocked")]);
      setOpen(shop.open);
      setMessage(shop.message);
      setSaved(shop);
      setBlocked(blocked);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (open === null) return;
    if (!open && saved.open && !window.confirm("Close the shop? Customers will not be able to place orders.")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { shop } = await adminApi("/api/admin/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open, message }),
      });
      setSaved(shop);
      setNotice(shop.open ? "Shop is open. Customers can order." : "Shop is closed. Customers see your message.");
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function block() {
    setError("");
    try {
      await adminApi("/api/admin/blocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, reason: "Added manually" }),
      });
      setNewPhone("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function unblock(phone: string) {
    try {
      await adminApi(`/api/admin/blocked?phone=${encodeURIComponent(phone)}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const dirty = open !== null && (open !== saved.open || message.trim() !== saved.message);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Shop settings</h1>
        <p className="text-sm text-secondary-text">Control whether customers can place orders.</p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{notice}</p>}

      <HoursEditor />

      <section className="rounded-2xl border border-warm-gray bg-white p-5">
        <h2 className="mb-1 font-medium">Pause orders</h2>
        <p className="mb-3 text-xs text-secondary-text">Orders follow the opening hours above. Use this to stop taking orders earlier than that, for example when you are sold out.</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Shop status">
          {[
            { value: true, label: "Follow opening hours", sub: "Orders open and close by themselves", on: "border-success bg-success/10" },
            { value: false, label: "Pause orders now", sub: "No orders until you switch back", on: "border-red-400 bg-red-50" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              role="radio"
              aria-checked={open === opt.value}
              onClick={() => setOpen(opt.value)}
              className={`rounded-2xl border-2 p-4 text-left transition-colors ${open === opt.value ? opt.on : "border-warm-gray"}`}
            >
              <span className="block text-lg font-semibold">{opt.label}</span>
              <span className="block text-xs text-secondary-text">{opt.sub}</span>
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-medium">
          Message for customers {open ? "(only shown while paused)" : ""}
          <textarea
            rows={2}
            maxLength={200}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. We're closed for today. Back tomorrow at 6:30 AM."
            className="mt-1 w-full rounded-xl border border-warm-gray px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setMessage(p)} className="rounded-full border border-warm-gray px-3 py-1 text-xs text-secondary-text hover:border-accent/40">
              {p.length > 34 ? p.slice(0, 34) + "…" : p}
            </button>
          ))}
        </div>

        {open === false && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="text-xs font-semibold uppercase tracking-wide">What customers will see</p>
            <p className="mt-1">🔒 Orders are paused. {message.trim() || "Please check back soon."}</p>
          </div>
        )}

        <button onClick={save} disabled={busy || !dirty} className="btn-primary mt-5 disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        <p className="mt-2 text-xs text-secondary-text">
          Orders already received keep going. Customers can still browse the shop while orders are paused or the shop is closed.
        </p>
      </section>

      <section className="rounded-2xl border border-warm-gray bg-white p-5">
        <h2 className="font-medium">Blocked phone numbers</h2>
        <p className="mb-3 text-xs text-secondary-text">
          Blocked numbers cannot place online orders (use this for dummy or abusive orders). You can also block a number from any order.
        </p>
        <div className="mb-4 flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="flex-1 rounded-full border border-warm-gray px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button onClick={block} disabled={!newPhone.trim()} className="btn-secondary !py-2 !px-4 !text-xs disabled:opacity-50">Block</button>
        </div>
        {blocked.length === 0 ? (
          <p className="text-sm text-secondary-text">No blocked numbers.</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {blocked.map((b) => (
              <li key={b.phone} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-medium">{formatPhone(b.phone)}</span>
                <span className="flex-1 truncate text-xs text-secondary-text">{b.reason}</span>
                <button onClick={() => unblock(b.phone)} className="text-xs text-accent hover:underline">Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
