"use client";

import { useEffect, useState } from "react";
import BusinessEditor from "./BusinessEditor";
import FaqEditor from "./FaqEditor";
import PoliciesEditor from "./PoliciesEditor";
import TestimonialsEditor from "./TestimonialsEditor";

const TABS = [
  { id: "policies", label: "Policies", sub: "Privacy, terms, delivery, cancellation, refunds" },
  { id: "business", label: "Business details", sub: "Delivery rules, contact, hours, legal info, notice bar" },
  { id: "testimonials", label: "Reviews", sub: "Customer reviews on the home page" },
  { id: "faqs", label: "FAQ", sub: "Questions and answers on the home page" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ContentPanel() {
  const [tab, setTab] = useState<Tab>("policies");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, []);
  const current = TABS.find((t) => t.id === tab)!;

  function choose(t: Tab) {
    setTab(t);
    window.history.replaceState(null, "", `?tab=${t}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Website content</h1>
        <p className="text-sm text-secondary-text">Edit what customers read. Changes go live straight away.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === tab} onClick={() => choose(t.id)} className={`flex-shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium ${t.id === tab ? "border-accent bg-accent text-white" : "border-warm-gray bg-white text-secondary-text"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-xs text-secondary-text">{current.sub}</p>
      {tab === "policies" && <PoliciesEditor />}
      {tab === "business" && <BusinessEditor />}
      {tab === "testimonials" && <TestimonialsEditor />}
      {tab === "faqs" && <FaqEditor />}
    </div>
  );
}
