"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { DEFAULT_HOURS, shopNow, type HoursException, type OpeningHours } from "@/lib/hours";
import { DAY_NAMES } from "@/lib/pricing";
import { adminApi } from "../../api";
import { SHOP_CHANGED_EVENT } from "../../AdminShell";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const input = "rounded-xl border border-warm-gray bg-white px-3 py-2 text-base outline-none focus:border-accent sm:text-sm";
const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-warm-gray"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
    </button>
  );
}

export default function HoursEditor() {
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [newDate, setNewDate] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/hours");
      setHours(d.hours);
      setSaved(JSON.stringify(d.hours));
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
      setHours(DEFAULT_HOURS);
      setSaved(JSON.stringify(DEFAULT_HOURS));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const preview = useMemo(() => (hours ? shopNow(hours, { open: true, message: "" }) : null), [hours]);
  if (!hours) return <section className="rounded-2xl border border-warm-gray bg-white p-5 text-sm text-secondary-text">Loading opening hours…</section>;
  const dirty = JSON.stringify(hours) !== saved;

  const setDay = (i: number, patch: Partial<OpeningHours["week"][number]>) =>
    setHours({ ...hours, week: hours.week.map((d, k) => (k === i ? { ...d, ...patch } : d)) });
  const setEx = (date: string, patch: Partial<HoursException>) =>
    setHours({ ...hours, exceptions: hours.exceptions.map((e) => (e.date === date ? { ...e, ...patch } : e)) });
  const copyToAll = (i: number) => setHours({ ...hours, week: hours.week.map(() => ({ ...hours.week[i] })) });
  const addEx = () => {
    if (!newDate || hours.exceptions.some((e) => e.date === newDate)) return;
    setHours({ ...hours, exceptions: [...hours.exceptions, { date: newDate, closed: true }].sort((a, b) => a.date.localeCompare(b.date)) });
    setNewDate("");
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const d = await adminApi("/api/admin/hours", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hours) });
      setHours(d.hours);
      setSaved(JSON.stringify(d.hours));
      setMsg({ tone: "ok", text: "Opening hours saved. The website follows them from now on." });
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    }
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-warm-gray bg-white p-5">
      <h2 className="flex items-center gap-2 font-medium"><Clock size={18} className="text-accent" /> Opening hours</h2>
      <p className="mb-4 text-xs text-secondary-text">Outside these hours customers see the closed view and cannot place orders. Times are Indian time.</p>

      {msg && <p role={msg.tone === "error" ? "alert" : "status"} className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.tone === "ok" ? "bg-success/10 text-success" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      <ul className="divide-y divide-warm-gray/70">
        {ORDER.map((i) => {
          const d = hours.week[i];
          return (
            <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <span className="w-24 text-sm font-medium">{DAY_NAMES[i]}</span>
              <Switch on={d.open} onChange={(v) => setDay(i, { open: v })} label={`${DAY_NAMES[i]} open`} />
              {d.open ? (
                <span className="flex items-center gap-2 text-sm">
                  <input type="time" value={d.from} onChange={(e) => setDay(i, { from: e.target.value })} className={input} aria-label={`${DAY_NAMES[i]} opens`} />
                  to
                  <input type="time" value={d.to} onChange={(e) => setDay(i, { to: e.target.value })} className={input} aria-label={`${DAY_NAMES[i]} closes`} />
                  <button type="button" onClick={() => copyToAll(i)} className="hidden text-xs text-secondary-text underline hover:text-accent sm:inline">Use for all days</button>
                </span>
              ) : (
                <span className="text-sm text-secondary-text">Closed all day</span>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="mb-1 mt-6 text-sm font-medium">Special days</h3>
      <p className="mb-3 text-xs text-secondary-text">Holidays or a day with different hours. These replace the weekly hours for that date.</p>
      {hours.exceptions.length > 0 && (
        <ul className="mb-3 space-y-2">
          {hours.exceptions.map((e) => (
            <li key={e.date} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 ${e.date < today() ? "border-warm-gray bg-cream/60 opacity-70" : "border-warm-gray"}`}>
              <b className="w-28 text-sm">{new Date(e.date + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</b>
              <span className="flex rounded-full border border-warm-gray p-0.5 text-xs">
                {([[true, "Closed"], [false, "Different hours"]] as const).map(([v, l]) => (
                  <button key={l} type="button" onClick={() => setEx(e.date, v ? { closed: true } : { closed: false, from: e.from ?? "06:30", to: e.to ?? "17:00" })} className={`rounded-full px-3 py-1.5 ${e.closed === v ? "bg-primary-text text-white" : ""}`}>{l}</button>
                ))}
              </span>
              {!e.closed && (
                <span className="flex items-center gap-2 text-sm">
                  <input type="time" value={e.from ?? ""} onChange={(ev) => setEx(e.date, { from: ev.target.value })} className={input} aria-label="Opens" /> to
                  <input type="time" value={e.to ?? ""} onChange={(ev) => setEx(e.date, { to: ev.target.value })} className={input} aria-label="Closes" />
                </span>
              )}
              <input value={e.note ?? ""} onChange={(ev) => setEx(e.date, { note: ev.target.value })} maxLength={80} placeholder="Reason, e.g. Diwali" className={`${input} min-w-[8rem] flex-1`} />
              <button type="button" aria-label="Remove" onClick={() => setHours({ ...hours, exceptions: hours.exceptions.filter((x) => x.date !== e.date) })} className="flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input type="date" value={newDate} min={today()} onChange={(e) => setNewDate(e.target.value)} className={input} aria-label="Date of the special day" />
        <button type="button" onClick={addEx} disabled={!newDate} className="inline-flex items-center gap-1.5 rounded-full border border-warm-gray px-4 text-sm font-medium disabled:opacity-50"><Plus size={15} /> Add special day</button>
      </div>

      {preview && (
        <p className={`mt-5 rounded-xl px-4 py-3 text-sm ${preview.open ? "bg-success/10 text-success" : "bg-amber-50 text-amber-900"}`}>
          <b>With these hours, right now:</b> {preview.open ? `${preview.label}.` : `${preview.message}`}
        </p>
      )}
      <button type="button" onClick={save} disabled={busy || !dirty} className="btn-primary mt-4 disabled:opacity-50">{busy ? "Saving…" : "Save opening hours"}</button>
    </section>
  );
}
