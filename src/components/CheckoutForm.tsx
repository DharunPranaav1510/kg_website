"use client";

import { DELIVER_NOW } from "@/lib/delivery";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PhoneCall } from "lucide-react";
import LocationButton from "@/components/LocationButton";
import Turnstile, { turnstileConfigured } from "@/components/Turnstile";
import { rememberOrder } from "@/components/mobile/orderStatus";
import { useCart } from "@/context/CartContext";
import { useBusiness } from "@/context/BusinessContext";
import { normalizeEmail, normalizeIndianMobile } from "@/lib/phone";

const CUSTOMER_KEY = "kg-foods-customer";

export interface PlacedOrder {
  id: string | null;
  number: number | null;
  total: number;
  phone: string;
  name: string;
}

interface Fields {
  name: string;
  phone: string;
  email: string;
  house: string;
  street: string;
  area: string;
  landmark: string;
  pincode: string;
  slot: string;
  note: string;
}

type FieldName = keyof Fields;

const EMPTY: Fields = {
  name: "",
  phone: "",
  email: "",
  house: "",
  street: "",
  area: "",
  landmark: "",
  pincode: "",
  slot: "",
  note: "",
};

const inputCls = (error?: string) =>
  `w-full min-h-12 rounded-xl border bg-white px-4 py-3 text-base text-primary-text placeholder:text-secondary-text/50 transition-all focus:outline-none focus:shadow-glow ${
    error ? "border-accent" : "border-warm-gray focus:border-accent/40"
  }`;

function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id: FieldName;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`ck-${id}`} className="mb-1.5 block text-sm font-medium text-primary-text">
        {label}
        {optional && <span className="font-normal text-secondary-text"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-accent">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-secondary-text">{hint}</p>
      ) : null}
    </div>
  );
}

export default function CheckoutForm({
  subtotal,
  gstExtra,
  deliveryFee,
  total,
  onBack,
  onPlaced,
}: {
  subtotal: number;
  gstExtra: number;
  deliveryFee: number;
  total: number;
  onBack: () => void;
  onPlaced: (order: PlacedOrder) => void;
}) {
  const { items, clearCart } = useCart();
  const business = useBusiness();
  const [f, setF] = useState<Fields>({ ...EMPTY, pincode: business.address.pincode, slot: DELIVER_NOW });
  const [locationError, setLocationError] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const startedAt = useRef(Date.now());

  // Pre-fill from the last order made on this device.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CUSTOMER_KEY) ?? "{}");
      setF((cur) => {
        const next = { ...cur };
        for (const k of ["name", "phone", "email", "house", "street", "area", "landmark", "pincode"] as const) {
          if (typeof saved[k] === "string" && saved[k]) next[k] = saved[k];
        }
        return next;
      });
    } catch {
      /* ignore */
    }
  }, []);

  const set = (k: FieldName, v: string) => {
    setF((cur) => ({ ...cur, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate(): Partial<Record<FieldName, string>> {
    const e: Partial<Record<FieldName, string>> = {};
    if (f.name.trim().length < 2) e.name = "Please enter your name";
    if (!normalizeIndianMobile(f.phone)) e.phone = "Enter a valid 10-digit mobile number (it should start with 6, 7, 8 or 9)";
    if (normalizeEmail(f.email) === null) e.email = "That email doesn't look right";
    if (!f.house.trim()) e.house = "Enter your house / flat number";
    if (f.street.trim().length < 3) e.street = "Enter your street or building name";
    if (f.area.trim().length < 2) e.area = "Enter your area";
    if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "Pincode must be 6 digits";
    return e;
  }

  const order: FieldName[] = ["name", "phone", "email", "house", "street", "area", "pincode"];

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    const e = validate();
    setErrors(e);
    const firstBad = order.find((k) => e[k]);
    const needsPin = business.delivery.radiusKm > 0 && !gps;
    if (needsPin) setLocationError("Please pin your delivery location so we can check we deliver to you.");
    if (!consent) setConsentError("Please tick the box to accept the policies before sending your order.");
    if (needsPin && !firstBad) {
      document.getElementById("ck-location")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (firstBad) {
      document.getElementById(`ck-${firstBad}`)?.focus();
      return;
    }
    if (needsPin) return;
    if (!consent) {
      document.getElementById("ck-consent")?.focus();
      return;
    }

    if (turnstileConfigured && !captcha) {
      setFormError("Please complete the security check below.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          phone: f.phone,
          email: f.email,
          address: {
            house: f.house,
            street: f.street,
            area: f.area,
            landmark: f.landmark,
            pincode: f.pincode,
            ...(gps ?? {}),
          },
          slot: f.slot,
          note: f.note,
          consent: true,
          items: items.map((i) => ({ id: i.product.id, weightKg: i.weightKg })),
          website: honeypot,
          startedAt: startedAt.current,
          turnstileToken: captcha,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field === "consent") {
          setConsentError(data.error);
        } else if (data.field === "location") {
          setLocationError(data.error);
          document.getElementById("ck-location")?.scrollIntoView({ block: "center", behavior: "smooth" });
        } else if (data.field && data.field in EMPTY) {
          setErrors({ [data.field]: data.error });
          document.getElementById(`ck-${data.field}`)?.focus();
        } else {
          setFormError(data.error ?? "Something went wrong. Please try again or call the shop.");
        }
        setSubmitting(false);
        setCaptchaReset((n) => n + 1);
        return;
      }

      try {
        window.localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({
            name: f.name.trim(),
            phone: f.phone.trim(),
            email: f.email.trim(),
            house: f.house.trim(),
            street: f.street.trim(),
            area: f.area.trim(),
            landmark: f.landmark.trim(),
            pincode: f.pincode.trim(),
          })
        );
      } catch {
        /* private mode: fine */
      }
      if (data.id && data.orderNumber) {
        try {
          window.localStorage.setItem("kg-foods-last-order", JSON.stringify({ id: data.id, number: data.orderNumber }));
          rememberOrder({ id: data.id, number: data.orderNumber, total: data.total ?? total, at: Date.now() });
        } catch {
          /* private mode: fine */
        }
      }
      clearCart();
      onPlaced({
        id: data.id ?? null,
        number: data.orderNumber ?? null,
        total: data.total ?? total,
        phone: normalizeIndianMobile(f.phone) ?? f.phone,
        name: f.name.trim(),
      });
    } catch {
      setFormError("No internet connection? Please check and try again.");
      setSubmitting(false);
    }
  }

  const phoneOk = !!normalizeIndianMobile(f.phone);

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        {/* How it works: orders are NOT confirmed automatically */}
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-2 flex items-center gap-2 font-semibold">
            <PhoneCall size={16} /> Your order is confirmed only after we call you
          </p>
          <ol className="list-inside list-decimal space-y-0.5 text-[13px] leading-snug">
            <li>Send your order here.</li>
            <li>Someone from {business.name} calls you to confirm it.</li>
            <li>We deliver and you pay on delivery (cash / UPI).</li>
          </ol>
        </div>

        <section className="space-y-4" aria-labelledby="ck-contact">
          <h3 id="ck-contact" className="font-display text-lg">Your details</h3>
          <Field id="name" label="Full name" error={errors.name}>
            <input id="ck-name" type="text" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls(errors.name)} placeholder="Your full name" />
          </Field>
          <Field id="phone" label="Mobile number" error={errors.phone} hint="We will call this number to confirm your order.">
            <div className={`flex min-h-12 items-stretch overflow-hidden rounded-xl border bg-white transition-all focus-within:shadow-glow ${errors.phone ? "border-accent" : "border-warm-gray focus-within:border-accent/40"}`}>
              <span className="flex items-center border-r border-warm-gray bg-cream px-3 text-base text-secondary-text">+91</span>
              <input
                id="ck-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value.replace(/[^\d\s+()-]/g, ""))}
                onBlur={() => {
                  const n = normalizeIndianMobile(f.phone);
                  if (n) set("phone", `${n.slice(3, 8)} ${n.slice(8)}`);
                }}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-secondary-text/50"
                placeholder="98765 43210"
                maxLength={18}
              />
              {phoneOk && <span className="flex items-center pr-3 text-success" aria-label="Valid number">✓</span>}
            </div>
          </Field>
          <Field id="email" label="Email" optional error={errors.email}>
            <input id="ck-email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={inputCls(errors.email)} placeholder="you@example.com" />
          </Field>
        </section>

        <section className="space-y-4" aria-labelledby="ck-address">
          <h3 id="ck-address" className="font-display text-lg">Delivery address <span className="text-sm font-normal text-secondary-text">· Hosur</span></h3>
          <LocationButton
            pinned={gps}
            required={business.delivery.radiusKm > 0}
            error={locationError}
            onClear={() => setGps(null)}
            onFound={(loc) => {
              setGps({ lat: loc.lat, lng: loc.lng });
              setLocationError("");
              setErrors((e) => ({ ...e, street: loc.street ? undefined : e.street, area: loc.area ? undefined : e.area, pincode: undefined }));
              setF((cur) => ({
                ...cur,
                street: cur.street.trim() ? cur.street : loc.street ?? cur.street,
                area: cur.area.trim() ? cur.area : loc.area ?? cur.area,
                pincode: loc.pincode ?? cur.pincode,
              }));
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field id="house" label="House / flat no." error={errors.house}>
              <input id="ck-house" type="text" autoComplete="address-line2" value={f.house} onChange={(e) => set("house", e.target.value)} className={inputCls(errors.house)} placeholder="12 / 3B" />
            </Field>
            <Field id="pincode" label="Pincode" error={errors.pincode}>
              <input id="ck-pincode" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={f.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} className={inputCls(errors.pincode)} />
            </Field>
          </div>
          <Field id="street" label="Street / building" error={errors.street}>
            <input id="ck-street" type="text" autoComplete="address-line1" value={f.street} onChange={(e) => set("street", e.target.value)} className={inputCls(errors.street)} placeholder="2nd Cross, Gandhi Road" />
          </Field>
          <Field id="area" label="Area" error={errors.area}>
            <input id="ck-area" type="text" autoComplete="address-level3" value={f.area} onChange={(e) => set("area", e.target.value)} className={inputCls(errors.area)} placeholder="e.g. Anna Nagar" />
            <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Common areas">
              {business.delivery.areas.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => set("area", a)}
                  className={`min-h-9 flex-shrink-0 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                    f.area.trim().toLowerCase() === a.toLowerCase()
                      ? "border-accent bg-accent text-white"
                      : "border-warm-gray bg-white text-secondary-text"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
          <Field id="landmark" label="Landmark" optional hint="Helps our delivery person find you.">
            <input id="ck-landmark" type="text" value={f.landmark} onChange={(e) => set("landmark", e.target.value)} className={inputCls()} placeholder="Near the temple / opposite school" />
          </Field>
        </section>

        <section className="space-y-3" aria-labelledby="ck-slot">
          <h3 id="ck-slot" className="font-display text-lg">Preferred delivery time</h3>
          <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="ck-slot">
            {[DELIVER_NOW, ...business.delivery.slots].map((s) => (
              <label key={s} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm transition-colors ${f.slot === s ? "border-accent bg-accent/5" : "border-warm-gray bg-white"}`}>
                <input type="radio" name="slot" checked={f.slot === s} onChange={() => set("slot", s)} className="h-4 w-4 accent-accent" />
                {s}
              </label>
            ))}
          </div>
          <p className="text-xs text-secondary-text">We will confirm the exact time when we call you. "Deliver now" means as soon as we can after that call.</p>
        </section>

        <Field id="note" label="Note for the shop" optional>
          <textarea id="ck-note" rows={2} value={f.note} onChange={(e) => set("note", e.target.value)} className={`${inputCls()} resize-none`} placeholder="e.g. remove skin, small pieces" />
        </Field>

        {/* Bot trap: hidden from people and screen readers */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
        </div>

        <Turnstile onToken={setCaptcha} resetKey={captchaReset} />

        {formError && (
          <div role="alert" className="rounded-xl border border-accent/20 bg-accent/10 p-3 text-sm text-accent">{formError}</div>
        )}
      </div>

      {/* Always-visible footer so the button never hides behind the keyboard or scroll */}
      <div className="border-t border-warm-gray bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-secondary-text">
            ₹{subtotal}{gstExtra ? ` + GST ₹${gstExtra}` : ""} + delivery {deliveryFee ? `₹${deliveryFee}` : "free"}
          </span>
          <span className="font-display text-xl">₹{total}</span>
        </div>
        <p className="mb-3 text-center text-xs font-medium text-amber-800">
          Not confirmed until we call you. Pay on delivery.
        </p>
        <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-xs leading-snug text-secondary-text">
          <input
            id="ck-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setConsentError(""); }}
            className="mt-0.5 h-5 w-5 flex-shrink-0 accent-accent"
          />
          <span>
            I have read and accept the{" "}
            <Link href="/terms" target="_blank" className="text-accent underline">Terms</Link>,{" "}
            <Link href="/privacy" target="_blank" className="text-accent underline">Privacy</Link>,{" "}
            <Link href="/delivery" target="_blank" className="text-accent underline">Delivery</Link>,{" "}
            <Link href="/cancellation" target="_blank" className="text-accent underline">Cancellation</Link> and{" "}
            <Link href="/refunds" target="_blank" className="text-accent underline">Refund</Link> policies. You may use my details only to confirm and deliver this order.
          </span>
        </label>
        {consentError && <p role="alert" className="mb-3 text-xs font-medium text-accent">{consentError}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="min-h-12 w-1/3 rounded-full border border-warm-gray text-sm font-medium transition-colors hover:border-accent/40">
            Back
          </button>
          <button type="submit" disabled={submitting} className="btn-primary min-h-12 flex-1 !py-3 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? "Sending…" : "Send order"}
          </button>
        </div>
      </div>
    </form>
  );
}
