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

const field = "w-full rounded-xl border border-warm-gray bg-white px-3.5 py-3 text-base outline-none transition-colors focus:border-accent sm:text-sm";
const chip = (on: boolean) =>
  `inline-flex min-h-10 items-center justify-center rounded-full border px-3.5 text-sm font-medium transition-colors ${on ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white text-secondary-text hover:border-accent/40"}`;

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium">{children}</span>
      {hint && <span className="text-right text-xs text-secondary-text">{hint}</span>}
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EXTRA_KG = [4, 5, 10];
const EXTRA_DZ = [3, 4];

export default function ProductFormExtras({
  value,
  onChange,
  isEgg,
  price,
}: {
  value: ExtrasDraft;
  onChange: (v: ExtrasDraft) => void;
  isEgg: boolean;
  price: number;
}) {
  const set = <K extends keyof ExtrasDraft>(k: K, v: ExtrasDraft[K]) => onChange({ ...value, [k]: v });
  const [custom, setCustom] = useState("");
  const unit = isEgg ? "dozen" : "kg";
  const presets = isEgg ? [...STANDARD_EGG_WEIGHTS, ...EXTRA_DZ] : [...STANDARD_WEIGHTS.filter((w) => w <= 3), ...EXTRA_KG];
  const chosen = value.allowedWeights;
  const toggleWeight = (w: number) =>
    set("allowedWeights", chosen.includes(w) ? chosen.filter((x) => x !== w) : [...chosen, w].sort((a, b) => a - b));
  const addCustom = () => {
    const w = Math.round(Number(custom) * 100) / 100;
    if (Number.isFinite(w) && w > 0 && w <= 50 && !chosen.includes(w)) set("allowedWeights", [...chosen, w].sort((a, b) => a - b));
    setCustom("");
  };

  const offer = Number(value.offerPrice);
  const off = value.offerPrice !== "" && price > 0 && offer < price ? percentOff({ pricePerKg: price, offer: { price: offer } } as Product) : 0;
  const toggleDay = (d: number) => set("schedDays", value.schedDays.includes(d) ? value.schedDays.filter((x) => x !== d) : [...value.schedDays, d].sort());

  return (
    <>
      <section className="space-y-3">
        <Label hint={chosen.length ? "Only these are offered" : "Standard steps are used"}>Quantities customers can choose ({unit})</Label>
        <div className="flex flex-wrap gap-2">
          {presets.map((w) => (
            <button key={w} type="button" aria-pressed={chosen.includes(w)} onClick={() => toggleWeight(w)} className={chip(chosen.includes(w))}>
              {w}
            </button>
          ))}
          {chosen.filter((w) => !presets.includes(w)).map((w) => (
            <button key={w} type="button" aria-pressed onClick={() => toggleWeight(w)} className={chip(true)}>{w} ✕</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={field} inputMode="decimal" placeholder={`Another quantity, e.g. 0.75`} value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
          <button type="button" onClick={addCustom} className="rounded-xl border border-warm-gray bg-white px-4 text-sm font-medium">Add</button>
        </div>
        <p className="text-xs text-secondary-text">
          Pick none to use the standard steps ({isEgg ? "½ to 2 dozen" : "¼ kg up to 3 kg"}). The Add button starts at ½ kg (1 dozen for eggs), or the nearest larger quantity you allow.
          {chosen.length > 0 && <button type="button" onClick={() => set("allowedWeights", [])} className="ml-2 underline">Back to standard</button>}
        </p>
      </section>

      <section className="space-y-3">
        <Label>GST and bill</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-xs text-secondary-text">GST % for this product</div>
            <input className={field} inputMode="decimal" placeholder="Category rate" value={value.gstRate} onChange={(e) => set("gstRate", e.target.value)} />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-secondary-text">HSN code (optional)</div>
            <input className={field} inputMode="numeric" placeholder="e.g. 0207" maxLength={8} value={value.hsn} onChange={(e) => set("hsn", e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
        <p className="text-xs text-secondary-text">Leave GST empty to use the rate set for this category in Website content &gt; Business details. Enter 0 for a product with no GST.</p>
      </section>

      <section className="space-y-3">
        <Label hint={off ? `${off}% off` : "optional"}>Offer price</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center overflow-hidden rounded-xl border border-warm-gray bg-white focus-within:border-accent">
            <span className="pl-3.5 text-secondary-text">₹</span>
            <input className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base outline-none sm:text-sm" inputMode="decimal" placeholder={`Offer price / ${unit}`} value={value.offerPrice} onChange={(e) => set("offerPrice", e.target.value)} aria-label="Offer price" />
          </div>
          <input className={field} placeholder="Label, e.g. Today's offer" maxLength={30} value={value.offerLabel} onChange={(e) => set("offerLabel", e.target.value)} aria-label="Offer label" />
          <label className="text-xs text-secondary-text">Starts (Indian time)
            <input type="datetime-local" className={`${field} mt-1`} value={value.offerFrom} onChange={(e) => set("offerFrom", e.target.value)} />
          </label>
          <label className="text-xs text-secondary-text">Ends (Indian time)
            <input type="datetime-local" className={`${field} mt-1`} value={value.offerTo} onChange={(e) => set("offerTo", e.target.value)} />
          </label>
        </div>
        <p className="text-xs text-secondary-text">The normal price is shown crossed out next to the offer price. Leave the dates empty for an offer that stays until you remove it.{value.offerPrice !== "" && <button type="button" onClick={() => onChange({ ...value, offerPrice: "", offerLabel: "", offerFrom: "", offerTo: "" })} className="ml-2 underline">Remove offer</button>}</p>
      </section>

      <section className="space-y-3">
        <button type="button" role="switch" aria-checked={value.schedOn} onClick={() => set("schedOn", !value.schedOn)} className="flex w-full items-center gap-3 rounded-xl border border-warm-gray bg-white px-3 py-3 text-left">
          <span className="flex-1">
            <span className="block text-sm font-medium">Show only at certain days and times</span>
            <span className="block text-xs text-secondary-text">For example, only on Sunday mornings or during a festival week.</span>
          </span>
          <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${value.schedOn ? "bg-success" : "bg-warm-gray"}`} aria-hidden="true">
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value.schedOn ? "left-[1.375rem]" : "left-0.5"}`} />
          </span>
        </button>
        {value.schedOn && (
          <div className="space-y-3 rounded-2xl border border-warm-gray bg-white p-3.5">
            <div>
              <div className="mb-1.5 text-xs text-secondary-text">Days (none picked = every day)</div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => (
                  <button key={d} type="button" aria-pressed={value.schedDays.includes(i)} onClick={() => toggleDay(i)} className={chip(value.schedDays.includes(i))}>{d}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-secondary-text">From time
                <input type="time" className={`${field} mt-1`} value={value.schedStart} onChange={(e) => set("schedStart", e.target.value)} />
              </label>
              <label className="text-xs text-secondary-text">Until time
                <input type="time" className={`${field} mt-1`} value={value.schedEnd} onChange={(e) => set("schedEnd", e.target.value)} />
              </label>
              <label className="text-xs text-secondary-text">From date
                <input type="date" className={`${field} mt-1`} value={value.schedFromDate} onChange={(e) => set("schedFromDate", e.target.value)} />
              </label>
              <label className="text-xs text-secondary-text">Until date
                <input type="date" className={`${field} mt-1`} value={value.schedToDate} onChange={(e) => set("schedToDate", e.target.value)} />
              </label>
            </div>
            <button type="button" role="switch" aria-checked={value.schedHide} onClick={() => set("schedHide", !value.schedHide)} className="flex w-full items-center gap-3 text-left">
              <span className="flex-1">
                <span className="block text-sm font-medium">Hide it completely outside these times</span>
                <span className="block text-xs text-secondary-text">Off: customers still see it, marked “Available …”, but cannot order it.</span>
              </span>
              <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${value.schedHide ? "bg-success" : "bg-warm-gray"}`} aria-hidden="true">
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value.schedHide ? "left-[1.375rem]" : "left-0.5"}`} />
              </span>
            </button>
            <p className="text-xs font-medium text-primary-text">
              Available: {describeSchedule({ days: value.schedDays, startTime: value.schedStart, endTime: value.schedEnd, fromDate: value.schedFromDate, toDate: value.schedToDate })} (Indian time)
            </p>
          </div>
        )}
      </section>
    </>
  );
}
