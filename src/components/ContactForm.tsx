"use client";

import { FormEvent, useRef, useState } from "react";
import Turnstile, { turnstileConfigured } from "@/components/Turnstile";
import { normalizeEmail, normalizeIndianMobile } from "@/lib/phone";
import { Loader2, Send } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  if (normalizeEmail(data.email) === null) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.phone.trim()) {
    errors.phone = "Mobile number is required";
  } else if (!normalizeIndianMobile(data.phone)) {
    errors.phone = "Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9)";
  }

  if (!data.message.trim()) {
    errors.message = "Message is required";
  } else if (data.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  return errors;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [serverError, setServerError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const startedAt = useRef(Date.now());

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (status === "success" || status === "error") {
      setStatus("idle");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus("idle");
      return;
    }

    if (turnstileConfigured && !captcha) {
      setServerError("Please complete the security check below.");
      setStatus("error");
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: honeypot, startedAt: startedAt.current, turnstileToken: captcha }),
      });
      const data = await res.json().catch(() => ({}));
      setCaptchaReset((n) => n + 1);

      if (!res.ok) {
        if (data.field && data.field in initialForm) {
          setErrors({ [data.field]: data.error });
          setStatus("idle");
        } else {
          setServerError(data.error ?? "");
          setStatus("error");
        }
        return;
      }

      setStatus("success");
      setForm(initialForm);
      startedAt.current = Date.now();
    } catch {
      setServerError("");
      setStatus("error");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 md:p-10">
      <h2 className="font-display text-xl sm:text-2xl text-primary-text mb-2">
        Send Us a Message
      </h2>
      <p className="text-sm text-secondary-text mb-6 sm:mb-8">
        Fill out the form below and our Hosur team will respond within 24 hours.
      </p>

      {status === "success" && (
        <div
          role="status"
          className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium"
        >
          Thank you for reaching out! Your message has been received. We&apos;ll
          call or email you within one business day.
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-medium"
        >
          {serverError || "Something went wrong. Please try again or call us directly."}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-primary-text mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 min-h-12 rounded-xl border text-base text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all disabled:opacity-60 ${
              errors.name ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="Your full name"
          />
          {errors.name && <p className="text-xs text-accent mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-1.5">
            Email <span className="font-normal text-secondary-text">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 min-h-12 rounded-xl border text-base text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all disabled:opacity-60 ${
              errors.email ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-accent mt-1.5">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary-text mb-1.5">
            Mobile number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 min-h-12 rounded-xl border text-base text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all disabled:opacity-60 ${
              errors.phone ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="+91 98765 43210"
          />
          {errors.phone && <p className="text-xs text-accent mt-1.5">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-primary-text mb-1.5">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            value={form.message}
            onChange={(e) => handleChange("message", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 min-h-12 rounded-xl border text-base text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all resize-none disabled:opacity-60 ${
              errors.message ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="Tell us about your order, delivery area, or enquiry..."
          />
          {errors.message && <p className="text-xs text-accent mt-1.5">{errors.message}</p>}
        </div>

        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
        </div>

        <Turnstile onToken={setCaptcha} resetKey={captchaReset} />

        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary mt-2 py-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Message
              <Send size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
