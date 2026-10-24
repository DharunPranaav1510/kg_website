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
  assert.ok("error" in parseProductInput({ ...base, packKg: 9 }));
  const loosely = parseProductInput({ ...base, packKg: "" });
  assert.ok("value" in loosely && loosely.value.packKg === undefined);
});
