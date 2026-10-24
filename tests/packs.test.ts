import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedWeightsFor, defaultWeight, isAllowedWeight, packCount, qtyText, stepWeight, MAX_PACKS } from "../src/lib/pricing";
import { parseProductInput } from "../src/lib/products-db";

const fish = { allowedWeights: undefined, isEgg: false, packKg: 1 };
const basha = { allowedWeights: undefined, isEgg: false, packKg: 2.5 };
const loose = { allowedWeights: undefined, isEgg: false };

test("a pack product offers whole numbers of packs only", () => {
  assert.deepEqual(allowedWeightsFor(fish).slice(0, 3), [1, 2, 3]);
  assert.equal(allowedWeightsFor(fish).length, MAX_PACKS);
  assert.deepEqual(allowedWeightsFor(basha).slice(0, 3), [2.5, 5, 7.5]);
  assert.equal(isAllowedWeight(basha, 5), true);
  assert.equal(isAllowedWeight(basha, 3), false);
  assert.equal(isAllowedWeight(fish, 0.5), false);
});

test("the first add is one pack, and the stepper moves one pack at a time", () => {
  assert.equal(defaultWeight(fish), 1);
  assert.equal(defaultWeight(basha), 2.5);
  assert.equal(stepWeight(basha, 2.5, 1), 5);
  assert.equal(stepWeight(basha, 2.5, -1), null);
  assert.equal(stepWeight(fish, MAX_PACKS, 1), null);
});

test("quantities read as packs, loose products as before", () => {
  assert.equal(qtyText(fish, 1), "1 pack");
  assert.equal(qtyText(fish, 3), "3 packs");
  assert.equal(qtyText(basha, 5), "2 packs");
  assert.equal(packCount(basha, 7.5), 3);
  assert.equal(qtyText(loose, 1.5), "1½ kg");
  assert.equal(qtyText({ ...loose, isEgg: true }, 1, true), "1 dz");
});

test("the admin can save a pack size, and a bad one is refused", () => {
  const base = { name: "Fish Fingers", category: "Processed Sea Foods", pricePerKg: 600, image: "", description: "" };
  const ok = parseProductInput({ ...base, packKg: 1, allowedWeights: [1, 2] });
  assert.ok("value" in ok && ok.value.packKg === 1 && ok.value.allowedWeights === undefined);
  assert.ok("error" in parseProductInput({ ...base, packKg: 30 }));
  const loosely = parseProductInput({ ...base, packKg: "" });
  assert.ok("value" in loosely && loosely.value.packKg === undefined);
});

test("a heavy pack stops before 50 kg in one line", () => {
  const flour = { allowedWeights: undefined, isEgg: false, packKg: 20 };
  assert.deepEqual(allowedWeightsFor(flour), [20, 40]);
});

test("a pack of unknown weight keeps its own words", () => {
  const base = { name: "Tortilla 10\"", category: "Ready To Cook", pricePerKg: 100, image: "", description: "" };
  const r = parseProductInput({ ...base, packKg: 1, packLabel: "pack of 10 pieces" });
  assert.ok("value" in r && r.value.packLabel === "pack of 10 pieces");
  assert.ok("value" in parseProductInput({ ...base, packKg: 20 }));
  assert.ok("error" in parseProductInput({ ...base, packKg: 30 }));
});

import { priceCart } from "../src/lib/pricing";
test("packs priced from a rounded per-kg price still total the sheet price", () => {
  const tax = { enabled: false, inclusive: false, categoryRates: {} };
  const cases: [number, number, number][] = [[153.33, 1.5, 230], [216.67, 1.5, 325], [186.67, 1.5, 280], [166.67, 1.2, 200], [131, 20, 2620], [85, 5, 425]];
  for (const [perKg, kg, expected] of cases) {
    const p = { id: "x", name: "x", category: "Ready To Cook", pricePerKg: perKg, image: "", description: "", packKg: kg };
    const priced = priceCart([{ product: p, weightKg: kg }], tax, Date.now());
    assert.equal(priced.payable, expected, `${perKg} x ${kg}`);
  }
});

import { packLabel } from "../src/lib/pricing";
test("small packs are described in grams", () => {
  assert.equal(packLabel({ packKg: 0.5 }), "500 g pack");
  assert.equal(packLabel({ packKg: 0.45 }), "450 g pack");
  assert.equal(packLabel({ packKg: 1 }), "1 kg pack");
  assert.equal(packLabel({ packKg: 2.5 }), "2.5 kg pack");
  assert.equal(packLabel({ packKg: 1, packLabel: "pack of 10 pieces" }), "pack of 10 pieces");
  assert.equal(packLabel({}), "");
});

test("a category the admin added is accepted only when it is in the allowed list", () => {
  const body = { name: "Pepper", category: "Spices", pricePerKg: 100, image: "", description: "" };
  assert.ok("error" in parseProductInput(body));
  assert.ok("value" in parseProductInput(body, ["Spices"]));
});
