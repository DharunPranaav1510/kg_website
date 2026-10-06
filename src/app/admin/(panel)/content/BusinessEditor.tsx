"use client";

import { useCallback, useEffect, useState } from "react";
import { phoneDisplay, type Business } from "@/lib/content-schema";
import { adminApi } from "../../api";
import { Field, Notice, Switch, fieldCls, useFlash } from "./ui";

interface Form {
  phone: string; whatsapp: string; email: string;
  street: string; city: string; state: string; pincode: string;
  hoursDisplay: string; hoursDays: string;
  minOrder: string; fee: string; freeAbove: string; slots: string; areas: string;
  legalName: string; fssai: string; grievanceName: string; grievanceEmail: string; grievancePhone: string;
  annOn: boolean; annText: string; annLink: string;
}

const toForm = (b: Business): Form => ({
  phone: b.contact.phoneDisplay, whatsapp: phoneDisplay(b.contact.whatsapp), email: b.contact.email,
  street: b.address.street, city: b.address.city, state: b.address.state, pincode: b.address.pincode,
  hoursDisplay: b.hours.display, hoursDays: b.hours.days,
  minOrder: String(b.delivery.minOrder), fee: String(b.delivery.fee), freeAbove: String(b.delivery.freeAbove),
  slots: b.delivery.slots.join("\n"), areas: b.delivery.areas.join("\n"),
  legalName: b.legal.legalName, fssai: b.legal.fssai, grievanceName: b.legal.grievanceName, grievanceEmail: b.legal.grievanceEmail, grievancePhone: b.legal.grievancePhone,
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
        hours: { display: form.hoursDisplay, days: form.hoursDays },
        delivery: { minOrder: form.minOrder, fee: form.fee, freeAbove: form.freeAbove, slots: lines(form.slots), areas: lines(form.areas) },
        legal: { legalName: form.legalName, fssai: form.fssai, grievanceName: form.grievanceName, grievanceEmail: form.grievanceEmail, grievancePhone: form.grievancePhone },
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

      <Section title="Delivery and ordering rules" hint="Applied to new orders straight away, in the cart, at checkout and on the server.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Minimum order (₹)">{input("minOrder", { inputMode: "numeric" })}</Field>
          <Field label="Delivery fee (₹)">{input("fee", { inputMode: "numeric" })}</Field>
          <Field label="Free delivery from (₹)">{input("freeAbove", { inputMode: "numeric" })}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Delivery time slots" hint="One per line. Customers choose one at checkout.">
            <textarea rows={4} className={fieldCls} value={form.slots} onChange={(e) => set("slots", e.target.value)} />
          </Field>
          <Field label="Areas you deliver to" hint="One per line. Shown as suggestions and in the Delivery Policy.">
            <textarea rows={4} className={fieldCls} value={form.areas} onChange={(e) => set("areas", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Contact and opening hours">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Shop phone">{input("phone", { inputMode: "tel", placeholder: "96778 33339" })}</Field>
          <Field label="WhatsApp number">{input("whatsapp", { inputMode: "tel" })}</Field>
          <Field label="Email">{input("email", { type: "email" })}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opening hours">{input("hoursDisplay", { placeholder: "6:30 AM – 8:00 PM" })}</Field>
          <Field label="Days open">{input("hoursDays", { placeholder: "Monday – Sunday" })}</Field>
        </div>
      </Section>

      <Section title="Address">
        <Field label="Street / landmark">{input("street")}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">{input("city")}</Field>
          <Field label="State">{input("state")}</Field>
          <Field label="Pincode">{input("pincode", { inputMode: "numeric", maxLength: 6 })}</Field>
        </div>
      </Section>

      <Section title="Legal details" hint="Shown in the footer and filled into the policies. Leave empty what you do not have yet.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal business name" optional>{input("legalName")}</Field>
          <Field label="FSSAI licence / registration number" optional hint="14 digits. Food sellers must show it.">{input("fssai", { inputMode: "numeric", maxLength: 14 })}</Field>
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
