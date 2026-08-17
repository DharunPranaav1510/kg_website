"use client";

import { FormEvent, useState } from "react";
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

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^[0-9+\s-]{10,15}$/.test(data.phone.trim())) {
    errors.phone = "Please enter a valid phone number";
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

    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      setForm(initialForm);
    } catch {
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
          Something went wrong. Please try again or call us directly.
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
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all disabled:opacity-60 ${
              errors.name ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="Your full name"
          />
          {errors.name && <p className="text-xs text-accent mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all disabled:opacity-60 ${
              errors.email ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-accent mt-1.5">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary-text mb-1.5">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={status === "submitting"}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all disabled:opacity-60 ${
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
            className={`w-full px-4 py-3 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all resize-none disabled:opacity-60 ${
              errors.message ? "border-accent" : "border-warm-gray focus:border-accent/40"
            }`}
            placeholder="Tell us about your order, delivery area, or enquiry..."
          />
          {errors.message && <p className="text-xs text-accent mt-1.5">{errors.message}</p>}
        </div>

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
