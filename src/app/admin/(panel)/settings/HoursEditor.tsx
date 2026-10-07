"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_HOURS, shopNow, type HoursException, type OpeningHours } from "@/lib/hours";
import { clock12, DAY_NAMES } from "@/lib/pricing";
import { adminApi } from "../../api";
import { SHOP_CHANGED_EVENT, SidePanel, useDraftBackup, clearDraft, clock, useUi } from "../../ui";
import CustomerView from "./CustomerView";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const input = "min-h-12 rounded-xl border border-warm-gray bg-white px-3 text-base outline-none focus:border-accent";
const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="flex h-12 w-14 flex-shrink-0 items-center justify-center">
      <span className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-success" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export default function HoursEditor({ manual }: { manual: { open: boolean; message: string } }) {
  const { toast } = useUi();
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [saved, setSaved] = useState<OpeningHours>(DEFAULT_HOURS);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newMode, setNewMode] = useState<"closed" | "different">("closed");
  const [newFrom, setNewFrom] = useState("06:30");
  const [newTo, setNewTo] = useState("12:00");
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/hours");
      setHours(d.hours);
      setSaved(d.hours);
    } catch (e) {
      setError((e as Error).message);
      setHours(DEFAULT_HOURS);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const { found, dirty, dismiss, discard } = useDraftBackup<OpeningHours>("hours", hours ?? saved, saved);
  const preview = useMemo(() => (hours ? shopNow(hours, manual) : null), [hours, manual]);
  if (!hours) return <p className="text-base text-secondary-text">Loading opening hours…</p>;

  const rowProblem = (i: number) => (hours.week[i].open && toMin(hours.week[i].to) <= toMin(hours.week[i].from) ? `${DAY_NAMES[i]} must close after it opens.` : "");
  const problems = [...Array(7).keys()].map(rowProblem).filter(Boolean);

  const setDay = (i: number, patch: Partial<OpeningHours["week"][number]>) => setHours({ ...hours, week: hours.week.map((d, k) => (k === i ? { ...d, ...patch } : d)) });
  const setEx = (date: string, patch: Partial<HoursException>) => setHours({ ...hours, exceptions: hours.exceptions.map((e) => (e.date === date ? { ...e, ...patch } : e)) });
  const copyMonday = () => setHours({ ...hours, week: hours.week.map(() => ({ ...hours.week[1] })) });

  function addEx() {
    if (!newDate || hours!.exceptions.some((e) => e.date === newDate)) return;
    const ex: HoursException =
      newMode === "closed" ? { date: newDate, closed: true, note: newNote.trim() || undefined } : { date: newDate, closed: false, from: newFrom, to: newTo, note: newNote.trim() || undefined };
    setHours({ ...hours!, exceptions: [...hours!.exceptions, ex].sort((a, b) => a.date.localeCompare(b.date)) });
    setAdding(false);
    setNewDate("");
    setNewNote("");
    setNewMode("closed");
  }

  async function save() {
    if (problems.length) return;
    setBusy(true);
    setError("");
    try {
      const d = await adminApi("/api/admin/hours", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hours) });
      setHours(d.hours);
      setSaved(d.hours);
      clearDraft("hours");
      toast({ text: "Opening hours saved and published." });
      window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
    } catch (e) {
      setError((e as Error).message);
      toast({ text: `Opening hours were not saved. ${(e as Error).message}`, tone: "error", retry: save });
    }
    setBusy(false);
  }

  const upcoming = hours.exceptions.filter((e) => e.date >= today());
  const past = hours.exceptions.filter((e) => e.date < today());
  const exRow = (e: HoursException) => (
    <li key={e.date} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warm-gray bg-white p-3">
      <b className="w-36 text-base">{niceDate(e.date)}</b>
      <span className="flex rounded-full border border-warm-gray p-0.5 text-base">
        {([[true, "Closed"], [false, "Different hours"]] as const).map(([v, l]) => (
          <button key={l} type="button" onClick={() => setEx(e.date, v ? { closed: true } : { closed: false, from: e.from ?? "06:30", to: e.to ?? "17:00" })} className={`min-h-12 rounded-full px-4 ${e.closed === v ? "bg-primary-text text-white" : ""}`}>{l}</button>
        ))}
      </span>
      {!e.closed && (
        <span className="flex items-center gap-2 text-base">
          <input type="time" value={e.from ?? ""} onChange={(ev) => setEx(e.date, { from: ev.target.value })} className={input} aria-label="Opens" /> to
          <input type="time" value={e.to ?? ""} onChange={(ev) => setEx(e.date, { to: ev.target.value })} className={input} aria-label="Closes" />
        </span>
      )}
      <input value={e.note ?? ""} onChange={(ev) => setEx(e.date, { note: ev.target.value })} maxLength={80} placeholder="Reason, e.g. Diwali" className={`${input} min-w-[8rem] flex-1`} />
      <button type="button" aria-label={`Remove ${niceDate(e.date)}`} onClick={() => setHours({ ...hours, exceptions: hours.exceptions.filter((x) => x.date !== e.date) })} className="flex h-12 w-12 items-center justify-center rounded-full text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
    </li>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-5">
        <p className="text-base text-secondary-text">Outside these hours customers see the closed view and cannot place orders. Times are Indian time.</p>

        {found && (
          <p className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
            <span className="flex-1">You have an unsaved draft from {clock(new Date(found.at).toISOString())}.</span>
            <button onClick={() => { setHours(found.value); dismiss(); }} className="min-h-12 rounded-full bg-amber-600 px-4 font-semibold text-white">Restore</button>
            <button onClick={discard} className="min-h-12 rounded-full border border-amber-300 px-4 font-medium">Discard</button>
          </p>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

        <section className="rounded-2xl border border-warm-gray bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-body text-lg font-semibold">Every week</h2>
            <button type="button" onClick={copyMonday} className="min-h-12 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream">Copy Monday to all days</button>
          </div>
          <ul className="divide-y divide-warm-gray/70">
            {ORDER.map((i) => {
              const d = hours.week[i];
              const p = rowProblem(i);
              return (
                <li key={i} className="py-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="w-24 text-base font-medium">{DAY_NAMES[i]}</span>
                    <Switch on={d.open} onChange={(v) => setDay(i, { open: v })} label={`${DAY_NAMES[i]} open`} />
                    <span className="w-14 text-base text-secondary-text">{d.open ? "Open" : "Closed"}</span>
                    <span className={`flex items-center gap-2 text-base ${d.open ? "" : "pointer-events-none opacity-40"}`}>
                      <input type="time" value={d.from} onChange={(e) => setDay(i, { from: e.target.value })} className={input} aria-label={`${DAY_NAMES[i]} opens`} disabled={!d.open} />
                      to
                      <input type="time" value={d.to} onChange={(e) => setDay(i, { to: e.target.value })} className={input} aria-label={`${DAY_NAMES[i]} closes`} disabled={!d.open} />
                    </span>
                    {d.open && !p && <span className="text-sm text-secondary-text">{clock12(d.from)} – {clock12(d.to)}</span>}
                  </div>
                  {p && <p role="alert" className="pb-1 pl-1 text-base font-medium text-red-600">{p}</p>}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-warm-gray bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-body text-lg font-semibold">Special days</h2>
              <p className="text-base text-secondary-text">A holiday, or different hours on one date. These replace the weekly hours.</p>
            </div>
            <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream"><Plus size={16} /> Add special day</button>
          </div>
          {upcoming.length === 0 ? <p className="py-3 text-base text-secondary-text">No special days coming up.</p> : <ul className="space-y-2">{upcoming.map(exRow)}</ul>}
          {past.length > 0 && (
            <details className="mt-3">
              <summary className="flex min-h-12 cursor-pointer items-center text-base font-medium text-secondary-text">Past ({past.length})</summary>
              <ul className="space-y-2 opacity-80">{past.map(exRow)}</ul>
            </details>
          )}
        </section>

        <div className="sticky bottom-[4.75rem] z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-warm-gray bg-white/95 px-4 py-3 shadow-hover backdrop-blur lg:bottom-4">
          <p className="min-w-[10rem] flex-1 text-base">{problems.length ? <span className="text-red-600">{problems[0]}</span> : dirty ? "You have unsaved changes." : "All changes are saved."}</p>
          <button onClick={() => setHours(saved)} disabled={!dirty} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream disabled:opacity-50">Discard</button>
          <button onClick={save} disabled={busy || !dirty || problems.length > 0} className="btn-primary min-h-12 !px-8 !text-base disabled:opacity-50">{busy ? "Saving…" : "Save and publish"}</button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {preview && <CustomerView status={preview} title="With these hours, right now" />}
      </aside>

      <SidePanel
        open={adding}
        onClose={() => setAdding(false)}
        title="Add special day"
        footer={<button onClick={addEx} disabled={!newDate || hours.exceptions.some((e) => e.date === newDate) || (newMode === "different" && toMin(newTo) <= toMin(newFrom))} className="btn-primary min-h-12 w-full !text-base disabled:opacity-50">Add special day</button>}
      >
        <div className="space-y-4">
          <label className="block text-base font-medium">1. Date
            <input type="date" value={newDate} min={today()} onChange={(e) => setNewDate(e.target.value)} className={`${input} mt-1 w-full`} />
          </label>
          {newDate && hours.exceptions.some((e) => e.date === newDate) && <p className="text-base text-red-600">That date is already on the list.</p>}
          <div>
            <p className="mb-1 text-base font-medium">2. What happens</p>
            <div className="grid grid-cols-2 gap-2">
              {([["closed", "Closed"], ["different", "Different hours"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setNewMode(v)} aria-pressed={newMode === v} className={`min-h-12 rounded-full border px-3 text-base font-medium ${newMode === v ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white"}`}>{l}</button>
              ))}
            </div>
            {newMode === "different" && (
              <div className="mt-3 flex items-center gap-2 text-base">
                <input type="time" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} className={`${input} flex-1`} aria-label="Opens" /> to
                <input type="time" value={newTo} onChange={(e) => setNewTo(e.target.value)} className={`${input} flex-1`} aria-label="Closes" />
              </div>
            )}
            {newMode === "different" && toMin(newTo) <= toMin(newFrom) && <p className="mt-1 text-base text-red-600">Closing time must be after opening time.</p>}
          </div>
          <label className="block text-base font-medium">3. Note (optional)
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} maxLength={80} placeholder="e.g. Diwali" className={`${input} mt-1 w-full`} />
          </label>
        </div>
      </SidePanel>
    </div>
  );
}
