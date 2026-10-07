"use client";

import { useState } from "react";

export const fieldCls =
  "min-h-12 w-full rounded-xl border border-warm-gray bg-white px-3.5 py-3 text-base outline-none transition-colors focus:border-accent";

export function Field({ label, hint, children, optional }: { label: string; hint?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-primary-text">
        {label}
        {optional && <span className="font-normal text-secondary-text"> (optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-secondary-text">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, title, hint }: { checked: boolean; onChange: (v: boolean) => void; title: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-1 py-2 text-left">
      <span className="flex-1">
        <span className="block text-base font-medium">{title}</span>
        {hint && <span className="block text-sm text-secondary-text">{hint}</span>}
      </span>
      <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-success" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok" | "error"; children: React.ReactNode }) {
  const cls = {
    info: "bg-sky-50 text-sky-900",
    warn: "border border-amber-300 bg-amber-50 text-amber-900",
    ok: "bg-success/10 text-success",
    error: "bg-red-50 text-red-700",
  }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-base ${cls}`}>{children}</div>;
}

/** Shows a short message that clears itself. */
export function useFlash() {
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const flash = (tone: "ok" | "error", text: string) => {
    setMsg({ tone, text });
    if (tone === "ok") setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 4000);
  };
  return { msg, flash, clear: () => setMsg(null) };
}
