import assert from "node:assert/strict";
import test from "node:test";
import { buildBill, rupeesInWords } from "../src/lib/bill";
import { productMovement } from "../src/lib/movement";
import {
  allowedWeightsFor,
  distanceKm,
  effectivePrice,
  isAllowedWeight,
  isHiddenNow,
  isWithinSchedule,
  istParts,
  offerActive,
  priceCart,
  snapWeight,
  stepWeight,
  unavailableNote,
  type TaxConfig,
} from "../src/lib/pricing";
import { parseProductInput } from "../src/lib/products-db";
import type { Product } from "../src/data/products";

const p = (over: Partial<Product> = {}): Product => ({ id: "x", name: "Chicken", category: "Chicken", pricePerKg: 200, image: "/images/a.jpg", description: "", ...over });
// 2026-10-04 is a Sunday. 05:00 UTC = 10:30 IST.
const sundayMorning = Date.parse("2026-10-04T05:00:00Z");
const mondayNight = Date.parse("2026-10-05T16:30:00Z"); // Mon 22:00 IST

test("Indian time parts", () => {
  const t = istParts(sundayMorning);
  assert.equal(t.day, 0);
  assert.equal(t.date, "2026-10-04");
  assert.equal(t.minutes, 10 * 60 + 30);
  assert.equal(istParts(Date.parse("2026-10-04T20:00:00Z")).date, "2026-10-05"); // past midnight in India
});

test("time and date windows", () => {
  assert.equal(isWithinSchedule(undefined, sundayMorning), true);
  assert.equal(isWithinSchedule({ days: [0], startTime: "06:00", endTime: "11:00" }, sundayMorning), true);
  assert.equal(isWithinSchedule({ days: [0], startTime: "11:00", endTime: "14:00" }, sundayMorning), false);
  assert.equal(isWithinSchedule({ days: [1, 2] }, sundayMorning), false);
  assert.equal(isWithinSchedule({ fromDate: "2026-10-05" }, sundayMorning), false);
  assert.equal(isWithinSchedule({ toDate: "2026-10-03" }, sundayMorning), false);
  assert.equal(isWithinSchedule({ startTime: "22:00", endTime: "02:00" }, mondayNight), true); // across midnight
  assert.equal(isWithinSchedule({ startTime: "06:00", endTime: "10:30" }, sundayMorning), false); // end is exclusive
});

test("hidden vs shown-but-unavailable", () => {
  const item = p({ schedule: { days: [1], hideWhenUnavailable: true } });
  assert.equal(isHiddenNow(item, sundayMorning), true);
  assert.equal(isHiddenNow(p({ schedule: { days: [1] } }), sundayMorning), false);
  assert.match(unavailableNote(p({ schedule: { days: [1], startTime: "06:00", endTime: "10:00" } }), sundayMorning) ?? "", /Mon · 6:00 AM – 10:00 AM/);
  assert.equal(unavailableNote(p(), sundayMorning), null);
});

test("offers apply only inside their dates and only when cheaper", () => {
  const o = p({ offer: { price: 150, from: "2026-10-04T00:00:00Z", to: "2026-10-05T00:00:00Z" } });
  assert.equal(offerActive(o, sundayMorning), true);
  assert.equal(effectivePrice(o, sundayMorning), 150);
  assert.equal(effectivePrice(o, Date.parse("2026-10-06T00:00:00Z")), 200); // ended
  assert.equal(offerActive(p({ offer: { price: 250 } }), sundayMorning), false); // not cheaper
});

test("allowed weights", () => {
  assert.deepEqual(allowedWeightsFor({ isEgg: true }), [0.5, 1, 1.5, 2]);
  assert.equal(allowedWeightsFor({}).length, 12);
  const chosen = { allowedWeights: [1, 0.5, 2, 2, -3, 99] };
  assert.deepEqual(allowedWeightsFor(chosen), [0.5, 1, 2]);
  assert.equal(isAllowedWeight(chosen, 1), true);
  assert.equal(isAllowedWeight(chosen, 0.75), false);
  assert.equal(snapWeight(chosen, 0.75), 1);
  assert.equal(snapWeight(chosen, 5), 2);
  assert.equal(stepWeight(chosen, 1, 1), 2);
  assert.equal(stepWeight(chosen, 2, 1), null);
  assert.equal(stepWeight(chosen, 0.5, -1), null);
});

const tax = (over: Partial<TaxConfig> = {}): TaxConfig => ({ enabled: true, inclusive: false, categoryRates: { "Frozen Products": 5 }, ...over });
const frozen = p({ id: "f", name: "Samosas", category: "Frozen Products", pricePerKg: 240, hsn: "1905" });

test("GST on frozen products, added on top", () => {
  const c = priceCart([{ product: frozen, weightKg: 1 }, { product: p(), weightKg: 0.5 }], tax());
  assert.equal(c.subtotal, 340); // 240 + 100
  assert.equal(c.lines[0].gstRate, 5);
  assert.equal(c.lines[0].gstAmount, 12);
  assert.equal(c.lines[1].gstRate, 0);
  assert.equal(c.gstTotal, 12);
  assert.equal(c.gstExtra, 12);
  assert.equal(c.payable, 352);
});

test("GST already included in the price", () => {
  const c = priceCart([{ product: frozen, weightKg: 1 }], tax({ inclusive: true }));
  assert.equal(c.subtotal, 240);
  assert.equal(c.gstTotal, 11.43); // 240 - 240/1.05
  assert.equal(c.gstExtra, 0);
  assert.equal(c.payable, 240);
});

test("product rate overrides the category rate, and switching GST off removes it", () => {
  assert.equal(priceCart([{ product: { ...frozen, gstRate: 12 }, weightKg: 1 }], tax()).lines[0].gstRate, 12);
  assert.equal(priceCart([{ product: { ...frozen, gstRate: 0 }, weightKg: 1 }], tax()).gstTotal, 0);
  assert.equal(priceCart([{ product: frozen, weightKg: 1 }], tax({ enabled: false })).gstTotal, 0);
});

test("an offer lowers the line price and the GST follows it", () => {
  const c = priceCart([{ product: { ...frozen, offer: { price: 200 } }, weightKg: 1 }], tax(), sundayMorning);
  assert.equal(c.lines[0].price, 200);
  assert.equal(c.lines[0].listPrice, 240);
  assert.equal(c.lines[0].gstAmount, 10);
});

test("distance from the shop", () => {
  const shop = { lat: 12.7357689, lng: 77.8260702 };
  assert.ok(distanceKm(shop, shop) < 0.001);
  const oneKmNorth = { lat: shop.lat + 1 / 111.2, lng: shop.lng };
  assert.ok(Math.abs(distanceKm(shop, oneKmNorth) - 1) < 0.05);
  assert.ok(distanceKm(shop, { lat: 12.9716, lng: 77.5946 }) > 30); // Bengaluru
});

test("product input: weights, GST, HSN, offer and schedule are validated", () => {
  const base = { name: "Samosas", category: "Frozen Products", pricePerKg: 240, image: "/images/a.jpg" };
  const ok = parseProductInput({ ...base, allowedWeights: [1, 0.5, 0.5], gstRate: "5", hsn: "1905", offer: { price: 200, label: "Festival", to: "2099-01-01T00:00:00Z" }, schedule: { days: [0, 6], startTime: "06:00", endTime: "10:00", hideWhenUnavailable: true } });
  assert.ok("value" in ok);
  if (!("value" in ok)) return;
  assert.deepEqual(ok.value.allowedWeights, [0.5, 1]);
  assert.equal(ok.value.gstRate, 5);
  assert.equal(ok.value.offer?.price, 200);
  assert.deepEqual(ok.value.schedule?.days, [0, 6]);
  for (const bad of [
    { allowedWeights: [0] },
    { gstRate: 80 },
    { hsn: "abc" },
    { offer: { price: 300 } },
    { offer: { price: 100, from: "2099-02-01T00:00:00Z", to: "2099-01-01T00:00:00Z" } },
    { schedule: { startTime: "25:00" } },
    { schedule: { fromDate: "2026-10-31", toDate: "2026-10-01" } },
  ]) {
    assert.ok("error" in parseProductInput({ ...base, ...bad }), JSON.stringify(bad));
  }
  const plain = parseProductInput(base);
  assert.ok("value" in plain && plain.value.offer === undefined && plain.value.schedule === undefined);
});

test("bill: GST on top, round off, tax rows", () => {
  const items = [
    { name: "Samosas", quantity: "1 kg", price: 240, unitPrice: 240, gstRate: 5, gstAmount: 12, hsn: "1905" },
    { name: "Chicken", quantity: "½ kg", price: 100, unitPrice: 200, gstRate: 0, gstAmount: 0 },
  ];
  const b = buildBill({ order_number: 7, created_at: "2026-10-04T05:00:00Z", items, total: 402, delivery_fee: 50, gst_total: 12, gst_inclusive: false });
  assert.equal(b.taxableTotal, 340);
  assert.equal(b.gstTotal, 12);
  assert.equal(b.itemsTotal, 352);
  assert.equal(b.roundOff, 0);
  assert.deepEqual(b.taxRows, [{ rate: 5, taxable: 240, cgst: 6, sgst: 6 }]);
  const inc = buildBill({ order_number: 8, created_at: "2026-10-04T05:00:00Z", items: [{ ...items[0], gstAmount: 11.43 }], total: 290, delivery_fee: 50, gst_inclusive: true });
  assert.equal(inc.lines[0].taxable, 228.57);
  assert.equal(inc.lines[0].amount, 240);
  assert.equal(inc.itemsTotal, 240);
  // an old order without GST fields still prints
  const old = buildBill({ order_number: 1, created_at: "2026-01-01T00:00:00Z", items: [{ name: "Eggs", quantity: "1 dozen", price: 90 }], total: 140, delivery_fee: 50 });
  assert.equal(old.gstTotal, 0);
  assert.equal(old.total, 140);
});

test("amount in words", () => {
  assert.equal(rupeesInWords(0), "Rupees Zero Only");
  assert.equal(rupeesInWords(402), "Rupees Four Hundred Two Only");
  assert.equal(rupeesInWords(1250), "Rupees One Thousand Two Hundred Fifty Only");
  assert.equal(rupeesInWords(123456), "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six Only");
});

test("slow movers", () => {
  const products = [{ id: "a", name: "Breast" }, { id: "b", name: "Thigh" }, { id: "c", name: "Liver" }];
  const m = productMovement(
    [
      { created_at: "2026-10-01T00:00:00Z", status: "delivered", items: [{ id: "a", name: "Breast", weightKg: 2, price: 500 }] },
      { created_at: "2026-10-03T00:00:00Z", status: "new", items: [{ id: "a", name: "Breast", weightKg: 1, price: 250 }, { name: "Thigh", weightKg: 1, price: 250 }] },
      { created_at: "2026-10-04T00:00:00Z", status: "cancelled", items: [{ id: "c", name: "Liver", weightKg: 9, price: 900 }] },
    ],
    products
  );
  assert.equal(m.a.qty, 3);
  assert.equal(m.a.orders, 2);
  assert.equal(m.a.lastOrderedAt, "2026-10-03T00:00:00Z");
  assert.equal(m.b.qty, 1); // matched by name for older orders
  assert.equal(m.c.orders, 0); // cancelled orders do not count
});
