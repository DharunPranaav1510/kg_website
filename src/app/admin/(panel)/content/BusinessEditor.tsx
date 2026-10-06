"use client";

import { useCallback, useEffect, useState } from "react";
import { shopCategories } from "@/data/products";
import { phoneDisplay, type Business } from "@/lib/content-schema";
import { adminApi } from "../../api";
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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-warm-gray bg-white p-4 sm:p-5">
      <div>
        <h2 className="font-medium">{title}</h2>
        {hint && <p className="text-xs text-secondary-text">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function BusinessEditor() {
  const [form, setForm] = useState<Form | null>(null);
  const [initial, setInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const { msg, flash, clear } = useFlash();

  const load = useCallback(async () => {
    try {
      const f = toForm((await adminApi("/api/admin/business")).business);
      setForm(f);
      setInitial(JSON.stringify(f));
    } catch (e) {
      flash("error", (e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!form) return <p className="py-10 text-center text-sm text-secondary-text">{msg?.text ?? "Loading…"}</p>;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const dirty = JSON.stringify(form) !== initial;
  const input = (k: keyof Form, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className={fieldCls} value={String(form[k])} onChange={(e) => set(k, e.target.value as never)} {...extra} />
  );

  async function save() {
    if (!form) return;
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
      setInitial(JSON.stringify(f));
      flash("ok", "Saved. The website now uses these details.");
    } catch (e) {
      flash("error", (e as Error).message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Section title="Notice bar" hint="A one-line message above the pages, for festival timings or a special offer. Customers can close it.">
        <Switch checked={form.annOn} onChange={(v) => set("annOn", v)} title="Show the notice bar" />
        {form.annOn && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Message" hint={`${form.annText.length} / 160`}>{input("annText", { maxLength: 160, placeholder: "Closed on Sunday for Diwali. Back Monday 6:30 AM." })}</Field>
            <Field label="Link" optional hint="Starts with / or https://">{input("annLink", { maxLength: 200, placeholder: "/delivery" })}</Field>
          </div>
        )}
      </Section>

      <Section title="Delivery" hint="Applied straight away in the cart, at checkout and on the server.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Delivery charge (₹)" hint="The same for every order.">{input("fee", { inputMode: "numeric" })}</Field>
          <Field label="Delivery radius (km)" hint="Circle around the shop. Empty = no limit.">{input("radiusKm", { inputMode: "decimal", placeholder: "6" })}</Field>
          <Field label="Minimum order (₹)">{input("minOrder", { inputMode: "numeric" })}</Field>
        </div>
        <Field label="Free delivery from (₹)" optional hint="Leave empty if delivery is never free.">{input("freeAbove", { inputMode: "numeric", placeholder: "Never free" })}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop latitude" hint="The centre of the delivery circle. In Google Maps, right-click the shop and tap the numbers to copy.">{input("lat", { inputMode: "decimal" })}</Field>
          <Field label="Shop longitude">{input("lng", { inputMode: "decimal" })}</Field>
        </div>
        <p className="text-xs text-secondary-text">Customers pin their address on a map at checkout. Orders outside the circle are refused, measured in a straight line from the shop.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Delivery time slots" hint="One per line. Customers choose one at checkout.">
            <textarea rows={4} className={fieldCls} value={form.slots} onChange={(e) => set("slots", e.target.value)} />
          </Field>
          <Field label="Areas you deliver to" hint="One per line. Shown as suggestions and in the Delivery Policy.">
            <textarea rows={4} className={fieldCls} value={form.areas} onChange={(e) => set("areas", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="GST" hint="Applied to every order and printed on the bill. Ask your CA which rate applies to each product group.">
        <Switch checked={form.gstOn} onChange={(v) => set("gstOn", v)} title="Charge GST" hint="Switch off if you are not GST registered." />
        {form.gstOn && (
          <>
            <Switch checked={form.gstInclusive} onChange={(v) => set("gstInclusive", v)} title="Prices already include GST" hint="Off: GST is added on top of the price at checkout. On: GST is only shown as part of the price on the bill." />
            <div className="grid gap-3 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <Field key={c} label={`${c} (%)`}>
                  <input className={fieldCls} inputMode="decimal" placeholder="0" value={form.rates[c] ?? ""} onChange={(e) => set("rates", { ...form.rates, [c]: e.target.value })} />
                </Field>
              ))}
            </div>
            <p className="text-xs text-secondary-text">Leave a category empty or 0 for no GST. A single product can have its own rate in its product form. Delivery charge has no GST added.</p>
          </>
        )}
      </Section>

      <Section title="Highlights" hint="Short badges on the home page, one per line (up to 6).">
        <textarea rows={3} className={fieldCls} value={form.highlights} onChange={(e) => set("highlights", e.target.value)} placeholder={"100% Halal\nRight-size birds"} />
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Shop phone">{input("phone", { inputMode: "tel", placeholder: "96778 33339" })}</Field>
          <Field label="WhatsApp number">{input("whatsapp", { inputMode: "tel" })}</Field>
          <Field label="Email">{input("email", { type: "email" })}</Field>
        </div>
        <p className="text-xs text-secondary-text">Opening hours are set under <a href="/admin/settings" className="font-medium text-accent underline">Shop settings</a>.</p>
      </Section>

      <Section title="Address">
        <Field label="Street / landmark">{input("street")}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">{input("city")}</Field>
          <Field label="State">{input("state")}</Field>
          <Field label="Pincode">{input("pincode", { inputMode: "numeric", maxLength: 6 })}</Field>
        </div>
      </Section>

      <Section title="Legal details and bill" hint="Shown in the footer, filled into the policies and printed at the top of every bill.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GSTIN" optional hint="15 characters. Printed on the bill.">{input("gstin", { maxLength: 15 })}</Field>
          <Field label="Legal business name" optional>{input("legalName")}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="FSSAI licence / registration number" optional hint="14 digits. Food sellers must show it.">{input("fssai", { inputMode: "numeric", maxLength: 14 })}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address printed on bills" optional hint="Empty = the shop address above.">{input("billAddress")}</Field>
          <Field label="Phone printed on bills" optional hint="Empty = the shop phone above.">{input("billPhone", { inputMode: "tel" })}</Field>
          <Field label="Bill number prefix" hint="Bills read PREFIX/00057, so online bills never clash with your counter's numbers.">{input("billPrefix", { maxLength: 8 })}</Field>
          <Field label="Message at the bottom of bills" optional>{input("billFooter", { maxLength: 80 })}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Grievance officer name" optional>{input("grievanceName")}</Field>
          <Field label="Grievance email" optional>{input("grievanceEmail", { type: "email" })}</Field>
          <Field label="Grievance phone" optional>{input("grievancePhone", { inputMode: "tel" })}</Field>
        </div>
      </Section>

      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-2xl border border-warm-gray bg-white/95 p-3 shadow-card backdrop-blur">
        <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary !px-8 !py-3 disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
        {dirty && <span className="text-sm font-medium text-amber-700">Unsaved changes</span>}
      </div>
    </div>
  );
}
