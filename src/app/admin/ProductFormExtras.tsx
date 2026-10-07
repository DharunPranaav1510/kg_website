"use client";

import { useState } from "react";
import { describeSchedule, percentOff, STANDARD_EGG_WEIGHTS, STANDARD_WEIGHTS } from "@/lib/pricing";
import type { Product } from "@/data/products";

export interface ExtrasDraft {
  allowedWeights: number[];
  gstRate: string; // "" = use the category rate
  hsn: string;
  offerPrice: string;
  offerLabel: string;
  offerFrom: string; // datetime-local, Indian time
  offerTo: string;
  schedOn: boolean;
  schedDays: number[];
  schedStart: string;
  schedEnd: string;
  schedFromDate: string;
  schedToDate: string;
  schedHide: boolean;
}

export const EMPTY_EXTRAS: ExtrasDraft = {
  allowedWeights: [],
  gstRate: "",
  hsn: "",
  offerPrice: "",
  offerLabel: "",
  offerFrom: "",
  offerTo: "",
  schedOn: false,
  schedDays: [],
  schedStart: "",
  schedEnd: "",
  schedFromDate: "",
  schedToDate: "",
  schedHide: false,
};

// "2026-10-31T18:30" typed by the admin is Indian time.
const fromIst = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : undefined);
const toIst = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
};

export function productToExtras(p: Product): ExtrasDraft {
  const s = p.schedule;
  return {
    allowedWeights: p.allowedWeights ?? [],
    gstRate: p.gstRate === null || p.gstRate === undefined ? "" : String(p.gstRate),
    hsn: p.hsn ?? "",
    offerPrice: p.offer ? String(p.offer.price) : "",
    offerLabel: p.offer?.label ?? "",
    offerFrom: toIst(p.offer?.from),
    offerTo: toIst(p.offer?.to),
    schedOn: !!s,
    schedDays: s?.days ?? [],
    schedStart: s?.startTime ?? "",
    schedEnd: s?.endTime ?? "",
    schedFromDate: s?.fromDate ?? "",
    schedToDate: s?.toDate ?? "",
    schedHide: s?.hideWhenUnavailable ?? false,
  };
}

/** The fields the API expects. */
export function extrasToPayload(e: ExtrasDraft) {
  return {
    allowedWeights: e.allowedWeights,
    gstRate: e.gstRate === "" ? null : Number(e.gstRate),
    hsn: e.hsn.trim(),
    offer: e.offerPrice === "" ? null : { price: Number(e.offerPrice), label: e.offerLabel, from: fromIst(e.offerFrom), to: fromIst(e.offerTo) },
    schedule: e.schedOn
      ? { days: e.schedDays, startTime: e.schedStart, endTime: e.schedEnd, fromDate: e.schedFromDate, toDate: e.schedToDate, hideWhenUnavailable: e.schedHide }
      : null,
  };
}

const field = "min-h-12 w-full rounded-xl border border-warm-gray bg-white px-3.5 text-base outline-none transition-colors focus:border-accent";
const chip = (on: boolean) =>
  `inline-flex min-h-12 items-center justify-center rounded-full border px-4 text-base font-medium transition-colors ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text hover:border-accent/40"}`;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0]; // chips run Monday first; the stored value keeps 0 = Sunday
const EXTRA_KG = [4, 5, 10];
const EXTRA_DZ = [3, 4];

type Props = { value: ExtrasDraft; onChange: (v: ExtrasDraft) => void; isEgg: boolean; price: number };

/** One-line summaries shown on the folded sections. */
export function weightsSummary(v: ExtrasDraft, isEgg: boolean) {
  return v.allowedWeights.length ? `${v.allowedWeights.join(", ")} ${isEgg ? "dozen" : "kg"}` : "Standard steps";
}
export function taxSummary(v: ExtrasDraft) {
  return `${v.gstRate === "" ? "Category rate" : `GST ${v.gstRate}%`}${v.hsn ? `, HSN ${v.hsn}` : ""}`;
}
export function offerSummary(v: ExtrasDraft) {
  return v.offerPrice === "" ? "No offer" : `₹${v.offerPrice}${v.offerLabel ? `, ${v.offerLabel}` : ""}`;
}
export function scheduleSummary(v: ExtrasDraft) {
  if (!v.schedOn) return "Every day, all hours";
  const d = describeSchedule({ days: v.schedDays, startTime: v.schedStart, endTime: v.schedEnd, fromDate: v.schedFromDate, toDate: v.schedToDate });
  return d === "always" ? "Every day, all hours" : d;
}

export function WeightsFields({ value, onChange, isEgg }: Props) {
  const set = <K extends keyof ExtrasDraft>(k: K, v: ExtrasDraft[K]) => onChange({ ...value, [k]: v });
  const [custom, setCustom] = useState("");
  const unit = isEgg ? "dozen" : "kg";
  const presets = isEgg ? [...STANDARD_EGG_WEIGHTS, ...EXTRA_DZ] : [...STANDARD_WEIGHTS.filter((w) => w <= 3), ...EXTRA_KG];
  const chosen = value.allowedWeights;
  const toggleWeight = (w: number) => set("allowedWeights", chosen.includes(w) ? chosen.filter((x) => x !== w) : [...chosen, w].sort((a, b) => a - b));
  const addCustom = () => {
    const w = Math.round(Number(custom) * 100) / 100;
    if (Number.isFinite(w) && w > 0 && w <= 50 && !chosen.includes(w)) set("allowedWeights", [...chosen, w].sort((a, b) => a - b));
    setCustom("");
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => set("allowedWeights", isEgg ? [...STANDARD_EGG_WEIGHTS] : [...STANDARD_WEIGHTS.filter((w) => w <= 3)])} className={chip(false)}>
          {isEgg ? "Use standard egg set" : "Use standard meat set"}
        </button>
        {chosen.length > 0 && <button type="button" onClick={() => set("allowedWeights", [])} className={chip(false)}>Back to standard steps</button>}
      </div>
      <p className="text-sm text-secondary-text">Tap to add or remove. Quantities are in {unit}. {chosen.length ? "Only these are offered." : "None picked: the standard steps are used."}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((w) => (
          <button key={w} type="button" aria-pressed={chosen.includes(w)} onClick={() => toggleWeight(w)} className={chip(chosen.includes(w))}>{w}</button>
        ))}
        {chosen.filter((w) => !presets.includes(w)).map((w) => (
          <button key={w} type="button" aria-pressed onClick={() => toggleWeight(w)} className={chip(true)}>{w} ✕</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className={field} inputMode="decimal" placeholder={`Another quantity, e.g. 0.75`} value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
        <button type="button" onClick={addCustom} className="min-h-12 rounded-xl border border-warm-gray bg-white px-5 text-base font-medium">Add</button>
      </div>
      <p className="text-sm text-secondary-text">The Add button starts at ½ kg (1 dozen for eggs), or the nearest larger quantity you allow.</p>
    </div>
  );
}

export function TaxFields({ value, onChange }: Props) {
  const set = <K extends keyof ExtrasDraft>(k: K, v: ExtrasDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">GST % for this product
          <input className={`${field} mt-1`} inputMode="decimal" placeholder="Category rate" value={value.gstRate} onChange={(e) => set("gstRate", e.target.value)} />
        </label>
        <label className="block text-sm font-medium">HSN code (optional)
          <input className={`${field} mt-1`} inputMode="numeric" placeholder="e.g. 0207" maxLength={8} value={value.hsn} onChange={(e) => set("hsn", e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      <p className="text-sm text-secondary-text">Empty means the category rate from Website content, Business details is used. Enter 0 for a product with no GST.</p>
    </div>
  );
}

export function OfferFields({ value, onChange, isEgg, price }: Props) {
  const set = <K extends keyof ExtrasDraft>(k: K, v: ExtrasDraft[K]) => onChange({ ...value, [k]: v });
  const unit = isEgg ? "dozen" : "kg";
  const offer = Number(value.offerPrice);
  const off = value.offerPrice !== "" && price > 0 && offer < price ? percentOff({ pricePerKg: price, offer: { price: offer } } as Product) : 0;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">Offer price {off ? <span className="font-normal text-success">· {off}% off</span> : null}
          <span className="mt-1 flex items-center overflow-hidden rounded-xl border border-warm-gray bg-white focus-within:border-accent">
            <span className="pl-3.5 text-secondary-text">₹</span>
            <input className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-base outline-none" inputMode="decimal" placeholder={`per ${unit}`} value={value.offerPrice} onChange={(e) => set("offerPrice", e.target.value)} />
          </span>
        </label>
        <label className="block text-sm font-medium">Label
          <input className={`${field} mt-1`} placeholder="e.g. Today's offer" maxLength={30} value={value.offerLabel} onChange={(e) => set("offerLabel", e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Starts (Indian time)
          <input type="datetime-local" className={`${field} mt-1`} value={value.offerFrom} onChange={(e) => set("offerFrom", e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Ends (Indian time)
          <input type="datetime-local" className={`${field} mt-1`} value={value.offerTo} onChange={(e) => set("offerTo", e.target.value)} />
        </label>
      </div>
      <p className="text-sm text-secondary-text">The normal price is shown crossed out next to the offer price. Leave the dates empty for an offer that stays until you remove it.</p>
      {value.offerPrice !== "" && (
        <button type="button" onClick={() => onChange({ ...value, offerPrice: "", offerLabel: "", offerFrom: "", offerTo: "" })} className={chip(false)}>Remove offer</button>
      )}
    </div>
  );
}

export function ScheduleFields({ value, onChange }: Props) {
  const set = <K extends keyof ExtrasDraft>(k: K, v: ExtrasDraft[K]) => onChange({ ...value, [k]: v });
  const toggleDay = (d: number) => set("schedDays", value.schedDays.includes(d) ? value.schedDays.filter((x) => x !== d) : [...value.schedDays, d].sort());
  const sw = (on: boolean) => (
    <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-gray-300"}`} aria-hidden="true">
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
    </span>
  );
  const sentence = describeSchedule({ days: value.schedDays, startTime: value.schedStart, endTime: value.schedEnd, fromDate: value.schedFromDate, toDate: value.schedToDate });
  return (
    <div className="space-y-3">
      <button type="button" role="switch" aria-checked={value.schedOn} onClick={() => set("schedOn", !value.schedOn)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-warm-gray bg-white px-3 py-2 text-left">
        <span className="flex-1">
          <span className="block text-base font-medium">Sell only at certain days and times</span>
          <span className="block text-sm text-secondary-text">For example, only on Sunday mornings or during a festival week.</span>
        </span>
        {sw(value.schedOn)}
      </button>
      {value.schedOn && (
        <div className="space-y-3 rounded-2xl border border-warm-gray bg-white p-3.5">
          <div>
            <div className="mb-1.5 text-sm font-medium">Days (none picked means every day)</div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <button key={d} type="button" aria-pressed={value.schedDays.includes(DAY_INDEX[i])} onClick={() => toggleDay(DAY_INDEX[i])} className={chip(value.schedDays.includes(DAY_INDEX[i]))}>{d}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">From time (Indian time)
              <input type="time" className={`${field} mt-1`} value={value.schedStart} onChange={(e) => set("schedStart", e.target.value)} />
            </label>
            <label className="block text-sm font-medium">Until time (Indian time)
              <input type="time" className={`${field} mt-1`} value={value.schedEnd} onChange={(e) => set("schedEnd", e.target.value)} />
            </label>
            <label className="block text-sm font-medium">From date
              <input type="date" className={`${field} mt-1`} value={value.schedFromDate} onChange={(e) => set("schedFromDate", e.target.value)} />
            </label>
            <label className="block text-sm font-medium">Until date
              <input type="date" className={`${field} mt-1`} value={value.schedToDate} onChange={(e) => set("schedToDate", e.target.value)} />
            </label>
          </div>
          <button type="button" role="switch" aria-checked={value.schedHide} onClick={() => set("schedHide", !value.schedHide)} className="flex min-h-12 w-full items-center gap-3 text-left">
            <span className="flex-1">
              <span className="block text-base font-medium">Hide it completely outside these times</span>
              <span className="block text-sm text-secondary-text">Off: customers still see it, marked “Available …”, but cannot order it.</span>
            </span>
            {sw(value.schedHide)}
          </button>
          <p className="rounded-lg bg-cream px-3 py-2 text-base font-medium">Sold: {sentence === "always" ? "every day, all hours" : sentence}, Indian time.</p>
        </div>
      )}
    </div>
  );
}
