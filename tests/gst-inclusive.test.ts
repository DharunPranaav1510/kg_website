import { test } from "node:test";
import assert from "node:assert/strict";
import { gstInclusiveFor, priceCart } from "../src/lib/pricing";
import { buildBill } from "../src/lib/bill";
import type { Product } from "../src/data/products";

const tax = { enabled: true, inclusive: false, categoryRates: { "Frozen Products": 5 } };
const zippy: Product = { id: "z", name: "Zippy Chicken Nuggets", category: "Ready To Cook", pricePerKg: 489, image: "", description: "", packKg: 1, gstRate: 5, gstInclusive: true };
const frozen: Product = { id: "f", name: "Frozen Nuggets", category: "Frozen Products", pricePerKg: 320, image: "", description: "" };

test("a product can say its price already includes GST", () => {
  assert.equal(gstInclusiveFor(zippy, tax), true);
  assert.equal(gstInclusiveFor(frozen, tax), false);
  assert.equal(gstInclusiveFor(frozen, { ...tax, inclusive: true }), true);
  assert.equal(gstInclusiveFor({ gstInclusive: false }, { ...tax, inclusive: true }), false);
});

test("included GST is not added again", () => {
  const c = priceCart([{ product: zippy, weightKg: 1 }], tax);
  assert.equal(c.subtotal, 489);
  assert.equal(c.payable, 489);
  assert.equal(c.gstExtra, 0);
  assert.equal(c.gstIncluded, 23.29); // 489 - 489 / 1.05
  assert.equal(c.lines[0].gstInclusive, true);
});

test("a mixed cart adds GST only to the lines that do not include it", () => {
  const c = priceCart([{ product: zippy, weightKg: 2 }, { product: frozen, weightKg: 1 }], tax);
  assert.equal(c.subtotal, 978 + 320);
  assert.equal(c.gstExtra, 16); // 5% of 320
  assert.equal(c.payable, 978 + 320 + 16);
  assert.equal(c.gstIncluded, 46.57);
});

test("the offer price keeps the GST inside too", () => {
  const offer = { ...zippy, offer: { price: 440, label: "10% off" } };
  const c = priceCart([{ product: offer, weightKg: 1 }], tax);
  assert.equal(c.payable, 440);
  assert.equal(c.gstIncluded, 20.95);
});

test("the bill treats each line by its own flag, and old orders by the order flag", () => {
  const c = priceCart([{ product: zippy, weightKg: 1 }, { product: frozen, weightKg: 1 }], tax);
  const items = c.lines.map((l) => ({ name: l.name, quantity: "1", weightKg: l.weightKg, price: l.price, unitPrice: l.unitPrice, gstRate: l.gstRate, gstAmount: l.gstAmount, gstInclusive: l.gstInclusive }));
  const bill = buildBill({ order_number: 1, created_at: new Date().toISOString(), items, total: c.payable + 50, delivery_fee: 50, gst_inclusive: false });
  assert.equal(bill.lines[0].amount, 489); // included: price stays
  assert.equal(bill.lines[0].taxable, 465.71);
  assert.equal(bill.lines[1].amount, 336); // added on top: 320 + 16
  assert.equal(bill.inclusive, false);
  assert.equal(bill.someInclusive, true);
  assert.equal(bill.roundOff, 0);
  // An order saved before this change has no per-line flag.
  const old = buildBill({ order_number: 2, created_at: new Date().toISOString(), items: [{ name: "x", quantity: "1", weightKg: 1, price: 105, gstRate: 5, gstAmount: 5 }], total: 105, delivery_fee: 0, gst_inclusive: true });
  assert.equal(old.lines[0].taxable, 100);
  assert.equal(old.inclusive, true);
});
