import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "../src/components/Markdown";
import {
  fillVars,
  isSafeLink,
  mergeBusiness,
  policyVariables,
  shopPhone,
  validateBusiness,
  validateFaq,
  validatePolicy,
  validateTestimonial,
} from "../src/lib/content-schema";
import { amountToFreeDelivery, deliveryFeeFor } from "../src/lib/delivery";

// The test runner compiles JSX the classic way, which looks for a global React.
(globalThis as unknown as { React: typeof React }).React = React;

const goodBusiness = () => ({
  contact: { phone: "96778 33339", whatsapp: "", email: "Shop@Example.com" },
  address: { street: "NH 44", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  hours: { display: "6:30 AM – 8:00 PM", days: "Monday – Sunday" },
  delivery: { minOrder: "200", fee: 30, freeAbove: "500", slots: ["Morning", "Evening", "Morning"], areas: ["Anna Nagar", ""] },
  legal: { legalName: "KG Meat Mart", fssai: "12345678901234", grievanceName: "Karthik", grievanceEmail: "g@example.com", grievancePhone: "9677833339" },
  announcement: { enabled: true, text: "Closed on Sunday", link: "/delivery" },
});

test("shop phone numbers are normalised", () => {
  assert.equal(shopPhone("96778 33339"), "+919677833339");
  assert.equal(shopPhone("+91 96778 33339"), "+919677833339");
  assert.equal(shopPhone("09677833339"), "+919677833339");
  assert.equal(shopPhone("12345"), null);
});

test("business details: valid input is cleaned", () => {
  const r = validateBusiness(goodBusiness());
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.contact?.phone, "+919677833339");
  assert.equal(r.value.contact?.whatsapp, "+919677833339"); // empty falls back to the shop phone
  assert.equal(r.value.contact?.email, "shop@example.com");
  assert.deepEqual(r.value.delivery?.slots, ["Morning", "Evening"]); // duplicates removed
  assert.deepEqual(r.value.delivery?.areas, ["Anna Nagar"]); // blanks dropped
  assert.equal(r.value.delivery?.minOrder, 200);
});

test("business details: bad input is rejected with a reason", () => {
  const cases: [string, (b: ReturnType<typeof goodBusiness>) => void][] = [
    ["phone", (b) => (b.contact.phone = "123")],
    ["email", (b) => (b.contact.email = "nope")],
    ["pincode", (b) => (b.address.pincode = "12")],
    ["fee", (b) => ((b.delivery as { fee: unknown }).fee = -5)],
    ["slots", (b) => (b.delivery.slots = [])],
    ["fssai", (b) => (b.legal.fssai = "123")],
    ["banner link", (b) => (b.announcement.link = "javascript:alert(1)")],
  ];
  for (const [name, mutate] of cases) {
    const b = goodBusiness();
    mutate(b);
    const r = validateBusiness(b);
    assert.equal(r.ok, false, name);
  }
});

test("merging keeps defaults and recomputes derived fields", () => {
  const r = validateBusiness(goodBusiness());
  assert.ok(r.ok);
  if (!r.ok) return;
  const b = mergeBusiness(r.value);
  assert.equal(b.contact.phoneDisplay, "+91 96778 33339");
  assert.equal(b.address.full, "NH 44, Hosur, Tamil Nadu 635109");
  assert.equal(b.name, "KG Meat Mart"); // untouched fields stay
  assert.equal(mergeBusiness(null).delivery.fee > 0, true);
});

test("delivery rules come from the business details", () => {
  const rules = { minOrder: 100, fee: 40, freeAbove: 300 };
  assert.equal(deliveryFeeFor(150, rules), 40);
  assert.equal(deliveryFeeFor(300, rules), 0);
  assert.equal(deliveryFeeFor(0, rules), 0);
  assert.equal(amountToFreeDelivery(250, rules), 50);
});

test("testimonials, FAQ and policies are validated", () => {
  assert.ok(validateTestimonial({ name: "Asha", quote: "Really fresh chicken, every time.", rating: 5 }).ok);
  assert.equal(validateTestimonial({ name: "", quote: "Really fresh chicken", rating: 5 }).ok, false);
  assert.equal(validateTestimonial({ name: "A", quote: "Really fresh chicken", rating: 9 }).ok, false);
  assert.equal(validateTestimonial({ name: "A", quote: "Really fresh chicken", rating: 5, image: "https://evil.example/x.png" }).ok, false);
  assert.ok(validateFaq({ question: "Do you deliver?", answer: "Yes, across Hosur." }).ok);
  assert.equal(validateFaq({ question: "?", answer: "" }).ok, false);
  assert.ok(validatePolicy({ title: "Privacy", body: "## Hello\nSome policy text that is long enough." }).ok);
  assert.equal(validatePolicy({ title: "Privacy", body: "short" }).ok, false);
});

test("placeholders are filled in and unknown ones are left visible", () => {
  const vars = policyVariables(mergeBusiness(null));
  const out = fillVars("Fee ₹{{delivery_fee}}, call {{phone}}, {{typo_here}}", vars);
  assert.match(out, /Fee ₹30/);
  assert.match(out, /\+91 96778 33339/);
  assert.match(out, /\{\{typo_here\}\}/);
});

test("links must be safe", () => {
  assert.equal(isSafeLink("/privacy"), true);
  assert.equal(isSafeLink("https://example.com/a"), true);
  assert.equal(isSafeLink("mailto:a@b.com"), true);
  assert.equal(isSafeLink("javascript:alert(1)"), false);
  assert.equal(isSafeLink("//evil.example"), false);
  assert.equal(isSafeLink("http://example.com"), false);
});

test("policy text renders without raw HTML and drops unsafe links", () => {
  const html = renderToStaticMarkup(
    createElement(Markdown, {
      text: "## Title\n\nHello **world** <script>alert(1)</script> [ok](/privacy) [bad](javascript:alert(1))\n\n- one\n- two\n\n1. first\n2. second",
    })
  );
  assert.match(html, /<h2[^>]*>Title<\/h2>/);
  assert.match(html, /<strong[^>]*>world<\/strong>/);
  assert.match(html, /&lt;script&gt;/); // escaped, not executed
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /href="\/privacy"/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<ul[^>]*><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol[^>]*><li>first<\/li><li>second<\/li><\/ol>/);
});
