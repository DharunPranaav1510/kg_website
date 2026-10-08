"use client";

import { useCallback, useEffect, useState } from "react";
import { shopCategories } from "@/data/products";
import { phoneDisplay, type Business } from "@/lib/content-schema";
import { adminApi } from "../../api";
import { mapsLink } from "@/lib/address";
import { clearDraft, clock, useDraftBackup, useUi } from "../../ui";
import { Field, Notice, Switch, fieldCls, useFlash } from "./ui";

interface Form {
  phone: string; whatsapp: string; email: string;
  street: string; city: string; state: string; pincode: string;
  minOrder: string; fee: string; freeAbove: string; radiusKm: string; slots: string; areas: string;
  lat: string; lng: string;
  gstOn: boolean; gstInclusive: boolean; rates: Record<string, string>;
  highlights: string;
  billAddress: string; billPhone: string; billPrefix: string; billFooter: string;
  gstin: string; legalName: string; fssai: string; grievanceName: string; grievanceEmail: string; grievancePhone: string;
  annOn: boolean; annText: string; annLink: string;
}

const CATEGORIES = shopCategories.filter((c) => c !== "All");

const toForm = (b: Business): Form => ({
  phone: b.contact.phoneDisplay, whatsapp: phoneDisplay(b.contact.whatsapp), email: b.contact.email,
  street: b.address.street, city: b.address.city, state: b.address.state, pincode: b.address.pincode,
  minOrder: String(b.delivery.minOrder), fee: String(b.delivery.fee), freeAbove: b.delivery.freeAbove > 0 ? String(b.delivery.freeAbove) : "", radiusKm: b.delivery.radiusKm > 0 ? String(b.delivery.radiusKm) : "",
  slots: b.delivery.slots.join("\n"), areas: b.delivery.areas.join("\n"),
  lat: String(b.maps.lat), lng: String(b.maps.lng),
  gstOn: b.tax.enabled, gstInclusive: b.tax.inclusive,
  rates: Object.fromEntries(CATEGORIES.map((c) => [c, b.tax.categoryRates[c] ? String(b.tax.categoryRates[c]) : ""])),
  highlights: b.highlights.join("\n"),
  billAddress: b.legal.billAddress, billPhone: b.legal.billPhone, billPrefix: b.legal.billPrefix, billFooter: b.legal.billFooter,
  gstin: b.legal.gstin, legalName: b.legal.legalName, fssai: b.legal.fssai, grievanceName: b.legal.grievanceName, grievanceEmail: b.legal.grievanceEmail, grievancePhone: b.legal.grievancePhone,
  annOn: b.announcement.enabled, annText: b.announcement.text, annLink: b.announcement.link,
});

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

/** Which fields belong to which card, so the save bar can say what changed. */
const CARDS: { id: string; title: string; keys: (keyof Form)[] }[] = [
  { id: "shop", title: "Shop and contact", keys: ["phone", "whatsapp", "email"] },
  { id: "address", title: "Address and location", keys: ["street", "city", "state", "pincode", "lat", "lng", "areas"] },
  { id: "delivery", title: "Delivery", keys: ["fee", "freeAbove", "minOrder", "radiusKm", "slots"] },
  { id: "gst", title: "GST", keys: ["gstOn", "gstInclusive", "rates"] },
  { id: "legal", title: "Legal and bill", keys: ["legalName", "gstin", "fssai", "billAddress", "billPhone", "billPrefix", "billFooter"] },
  { id: "grievance", title: "Grievance officer", keys: ["grievanceName", "grievanceEmail", "grievancePhone"] },
  { id: "highlights", title: "Highlights", keys: ["highlights"] },
  { id: "notice", title: "Notice bar", keys: ["annOn", "annText", "annLink"] },
];

function Card({ id, title, hint, changed, children }: { id: string; title: string; hint?: string; changed?: boolean; children: React.ReactNode }) {
  return (
    <section id={`card-${id}`} className="scroll-mt-20 space-y-4 rounded-2xl border border-warm-gray bg-white p-4 sm:p-5">
      <div>
        <h2 className="font-body text-lg font-semibold">{title} {changed && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-800">Unsaved</span>}</h2>
        {hint && <p className="text-base text-secondary-text">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** One value per row with add, remove and reorder, the same pattern as Reviews. */
function ChipList({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const [draft, setDraft] = useState("");
  const items = lines(value);
  const put = (next: string[]) => onChange(next.join("\n"));
  const add = () => {
    const t = draft.trim();
    if (t && !items.includes(t)) put([...items, t]);
    setDraft("");
  };
  return (
    <div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={it} className="flex items-center gap-1 rounded-xl border border-warm-gray px-3">
            <span className="min-h-12 flex-1 py-3 text-base">{it}</span>
            <button type="button" disabled={i === 0} onClick={() => { const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; put(n); }} aria-label={`Move ${it} up`} className="h-12 w-10 text-secondary-text disabled:opacity-30">↑</button>
            <button type="button" disabled={i === items.length - 1} onClick={() => { const n = [...items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; put(n); }} aria-label={`Move ${it} down`} className="h-12 w-10 text-secondary-text disabled:opacity-30">↓</button>
            <button type="button" onClick={() => put(items.filter((x) => x !== it))} aria-label={`Remove ${it}`} className="h-12 w-10 text-red-600">✕</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-base text-secondary-text">None yet.</li>}
      </ul>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} aria-label={label} className={fieldCls} />
        <button type="button" onClick={add} disabled={!draft.trim()} className="min-h-12 rounded-xl border border-warm-gray px-5 text-base font-medium disabled:opacity-50">Add</button>
      </div>
    </div>
  );
}

export default function BusinessEditor() {
  const { toast } = useUi();
  const [form, setForm] = useState<Form | null>(null);
  const [initial, setInitial] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const { msg, flash, clear } = useFlash();

  const load = useCallback(async () => {
    try {
      const f = toForm((await adminApi("/api/admin/business")).business);
      setForm(f);
      setInitial(f);
    } catch (e) {
      flash("error", (e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const { found, dismiss, discard } = useDraftBackup<Form | null>("business", form, initial);
  if (!form || !initial) return <p className="py-10 text-center text-base text-secondary-text">{msg?.text ?? "Loading…"}</p>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const changedCards = CARDS.filter((c) => c.keys.some((k) => JSON.stringify(form[k]) !== JSON.stringify(initial[k])));
  const dirty = changedCards.length > 0;
  const isChanged = (id: string) => changedCards.some((c) => c.id === id);
  const input = (k: keyof Form, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className={fieldCls} value={String(form[k])} onChange={(e) => set(k, e.target.value as never)} {...extra} />
  );
  const radius = Number(form.radiusKm);
  const goTo = (id: string) => document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const latOk = Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng)) && form.lat !== "" && form.lng !== "";
  const mailBad = (v: string) => v !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const phoneBad = (v: string) => v !== "" && v.replace(/\D/g, "").length < 10;
  const problems = [
    mailBad(form.email) && "The shop email is not a valid address.",
    mailBad(form.grievanceEmail) && "The grievance email is not a valid address.",
    phoneBad(form.grievancePhone) && "The grievance phone needs 10 digits.",
  ].filter(Boolean) as string[];

  async function save() {
    if (!form || problems.length) return;
    setSaving(true);
    clear();
    try {
      const body = {
        contact: { phone: form.phone, whatsapp: form.whatsapp, email: form.email },
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        delivery: { minOrder: form.minOrder, fee: form.fee, freeAbove: form.freeAbove, radiusKm: form.radiusKm, slots: lines(form.slots), areas: lines(form.areas) },
        location: { lat: form.lat, lng: form.lng },
        tax: { enabled: form.gstOn, inclusive: form.gstInclusive, categoryRates: form.rates },
        highlights: lines(form.highlights),
        legal: { billAddress: form.billAddress, billPhone: form.billPhone, billPrefix: form.billPrefix, billFooter: form.billFooter, gstin: form.gstin, legalName: form.legalName, fssai: form.fssai, grievanceName: form.grievanceName, grievanceEmail: form.grievanceEmail, grievancePhone: form.grievancePhone },
        announcement: { enabled: form.annOn, text: form.annText, link: form.annLink },
      };
      const { business } = await adminApi("/api/admin/business", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const f = toForm(business);
      setForm(f);
      setInitial(f);
      clearDraft("business");
      toast({ text: "Saved and published. The website now uses these details." });
    } catch (e) {
      flash("error", (e as Error).message);
      toast({ text: `Not saved. ${(e as Error).message}`, tone: "error", retry: save });
    }
    setSaving(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      {/* Section list: fixed on the left on desktop, a dropdown on phones */}
      <nav aria-label="Sections" className="lg:sticky lg:top-6 lg:self-start">
        <select onChange={(e) => goTo(e.target.value)} defaultValue="" aria-label="Jump to a section" className={`${fieldCls} lg:hidden`}>
          <option value="" disabled>Jump to a section…</option>
          {CARDS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <ul className="hidden space-y-1 lg:block">
          {CARDS.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => goTo(c.id)} className="flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-left text-base hover:bg-warm-gray/60">
                <span className="flex-1">{c.title}</span>
                {isChanged(c.id) && <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-label="unsaved" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4">
        {found && (
          <p className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
            <span className="flex-1">You have an unsaved draft from {clock(new Date(found.at).toISOString())}.</span>
            <button onClick={() => { if (found.value) setForm(found.value); dismiss(); }} className="min-h-12 rounded-full bg-amber-600 px-4 font-semibold text-white">Restore</button>
            <button onClick={discard} className="min-h-12 rounded-full border border-amber-300 px-4 font-medium">Discard</button>
          </p>
        )}
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <p className="text-base text-secondary-text">Opening hours are set in <a href="/admin/settings" className="font-medium text-accent underline">Shop settings</a>.</p>

        <Card id="shop" title="Shop and contact" changed={isChanged("shop")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Shop phone (+91)">{input("phone", { inputMode: "tel", placeholder: "96778 33339" })}</Field>
            <Field label="WhatsApp number (+91)">{input("whatsapp", { inputMode: "tel" })}</Field>
            <Field label="Email">{input("email", { type: "email" })}{mailBad(form.email) && <span className="mt-1 block text-sm font-medium text-red-600">Enter a valid email address.</span>}</Field>
          </div>
        </Card>

        <Card id="address" title="Address and location" changed={isChanged("address")} hint="Customers pin their address on a map at checkout. The shop pin is the centre of your delivery circle.">
          <Field label="Street / landmark">{input("street")}</Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City">{input("city")}</Field>
            <Field label="State">{input("state")}</Field>
            <Field label="Pincode">{input("pincode", { inputMode: "numeric", maxLength: 6 })}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop latitude" hint="In Google Maps, right-click the shop and tap the numbers to copy.">{input("lat", { inputMode: "decimal" })}</Field>
            <Field label="Shop longitude">{input("lng", { inputMode: "decimal" })}</Field>
          </div>
          {latOk && (
            <a href={mapsLink({ lat: Number(form.lat), lng: Number(form.lng), address: form.street })} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center text-base font-medium text-accent hover:underline">Check on map ↗</a>
          )}
          <Field label="Areas you deliver to" hint="Shown as suggestions and in the Delivery Policy.">
            <ChipList value={form.areas} onChange={(v) => set("areas", v)} placeholder="e.g. Anna Nagar" label="Add an area" />
          </Field>
        </Card>

        <Card id="delivery" title="Delivery" changed={isChanged("delivery")} hint="Applied straight away in the cart, at checkout and on the server.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Delivery charge (₹)" hint="The same for every order.">{input("fee", { inputMode: "numeric" })}</Field>
            <Field label="Delivery radius (km)" hint="Empty means no limit.">{input("radiusKm", { inputMode: "decimal", placeholder: "6" })}</Field>
            <Field label="Minimum order (₹)">{input("minOrder", { inputMode: "numeric" })}</Field>
          </div>
          <Field label="Free delivery from (₹)" optional hint="Leave empty if delivery is never free.">{input("freeAbove", { inputMode: "numeric", placeholder: "Never free" })}</Field>
          <p className="rounded-lg bg-cream px-3 py-2 text-base">
            {radius > 0 ? `Customers more than ${radius} km from the shop pin cannot order.` : "There is no distance limit for delivery."}{" "}
            Delivery costs ₹{form.fee || 0}{Number(form.freeAbove) > 0 ? `, free from ₹${form.freeAbove}` : ""}.
          </p>
          <Field label="Delivery time slots" hint="Customers choose one at checkout. “Deliver now” is always offered first.">
            <ChipList value={form.slots} onChange={(v) => set("slots", v)} placeholder="e.g. Morning (7 – 10 AM)" label="Add a time slot" />
          </Field>
        </Card>

        <Card id="gst" title="GST" changed={isChanged("gst")} hint="Applied to every order and printed on the bill. Ask your CA which rate applies to each product group.">
          <Switch checked={form.gstOn} onChange={(v) => set("gstOn", v)} title="Charge GST" hint="Switch off if you are not GST registered." />
          {form.gstOn && (
            <>
              <div role="radiogroup" aria-label="How GST is shown" className="grid gap-3 sm:grid-cols-2">
                {([[true, "Prices include GST", "A ₹100 item at 5% stays ₹100. The bill shows ₹4.76 of it as GST."], [false, "Add GST on top", "A ₹100 item at 5% becomes ₹105 at checkout."]] as const).map(([v, t, ex]) => (
                  <button key={t} type="button" role="radio" aria-checked={form.gstInclusive === v} onClick={() => set("gstInclusive", v)} className={`min-h-12 rounded-2xl border-2 p-3 text-left ${form.gstInclusive === v ? "border-accent bg-accent/5" : "border-warm-gray"}`}>
                    <span className="block text-base font-semibold">{t}</span>
                    <span className="block text-sm text-secondary-text">{ex}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <Field key={c} label={`${c} (%)`}>
                    <input className={fieldCls} inputMode="decimal" placeholder="0" value={form.rates[c] ?? ""} onChange={(e) => set("rates", { ...form.rates, [c]: e.target.value })} />
                  </Field>
                ))}
              </div>
              <p className="text-base text-secondary-text">Leave a category empty or 0 for no GST. A single product can have its own rate in its product form. Delivery charge has no GST added.</p>
            </>
          )}
        </Card>

        <Card id="legal" title="Legal and bill" changed={isChanged("legal")} hint="Shown in the footer, filled into the policies and printed at the top of every bill.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal business name" optional>{input("legalName")}</Field>
            <Field label="GSTIN" optional hint="15 characters. Printed on the bill.">{input("gstin", { maxLength: 15 })}</Field>
            <Field label="FSSAI licence / registration number" optional hint="14 digits. Food sellers must show it.">{input("fssai", { inputMode: "numeric", maxLength: 14 })}</Field>
            <Field label="Bill number prefix" hint="Bills read PREFIX/00057, so online bills never clash with your counter's numbers.">{input("billPrefix", { maxLength: 8 })}</Field>
            <Field label="Address printed on bills" optional hint="Empty means the shop address above.">{input("billAddress")}</Field>
            <Field label="Phone printed on bills" optional hint="Empty means the shop phone above.">{input("billPhone", { inputMode: "tel" })}</Field>
          </div>
          <Field label="Message at the bottom of bills" optional>{input("billFooter", { maxLength: 80 })}</Field>
          <p className="text-base text-secondary-text">To see these on a real bill, open any order and choose Print bill.</p>
        </Card>

        <Card id="grievance" title="Grievance officer" changed={isChanged("grievance")} hint="The person customers can complain to. Shown on the policy pages.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" optional>{input("grievanceName")}</Field>
            <Field label="Email" optional>{input("grievanceEmail", { type: "email" })}{mailBad(form.grievanceEmail) && <span className="mt-1 block text-sm font-medium text-red-600">Enter a valid email address.</span>}</Field>
            <Field label="Phone" optional>{input("grievancePhone", { inputMode: "tel" })}{phoneBad(form.grievancePhone) && <span className="mt-1 block text-sm font-medium text-red-600">Enter a 10-digit phone number.</span>}</Field>
          </div>
        </Card>

        <Card id="highlights" title="Highlights" changed={isChanged("highlights")} hint="Short badges on the home page (up to 6).">
          <ChipList value={form.highlights} onChange={(v) => set("highlights", v)} placeholder="e.g. 100% Halal" label="Add a highlight" />
        </Card>

        <Card id="notice" title="Notice bar" changed={isChanged("notice")} hint="A one-line message above the pages, for festival timings or a special offer. Customers can close it.">
          <Switch checked={form.annOn} onChange={(v) => set("annOn", v)} title="Show the notice bar" />
          {form.annOn && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Message" hint={`${form.annText.length} / 160`}>{input("annText", { maxLength: 160, placeholder: "Closed on Sunday for Diwali. Back Monday 6:30 AM." })}</Field>
                <Field label="Link" optional hint="Starts with / or https://">{input("annLink", { maxLength: 200, placeholder: "/delivery" })}</Field>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-secondary-text">How customers will see it</p>
                <p className="rounded-lg bg-primary-text px-4 py-2 text-center text-base text-white">{form.annText || "Your message appears here."}{form.annLink && <span className="ml-2 underline">Learn more</span>}</p>
              </div>
            </>
          )}
        </Card>

        <div className="sticky bottom-[4.75rem] z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-warm-gray bg-white/95 p-3 shadow-hover backdrop-blur lg:bottom-4">
          <p className="min-w-[10rem] flex-1 text-base">
            {problems.length ? <span className="text-red-600">{problems[0]}</span> : dirty ? <>Unsaved changes in <b>{changedCards.map((c) => c.title).join(", ")}</b></> : "All changes are saved."}
          </p>
          <button type="button" onClick={() => setForm(initial)} disabled={!dirty} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream disabled:opacity-50">Discard</button>
          <button type="button" onClick={save} disabled={!dirty || saving || problems.length > 0} className="btn-primary min-h-12 !px-8 !text-base disabled:opacity-50">{saving ? "Saving…" : "Save and publish"}</button>
        </div>
      </div>
    </div>
  );
}
