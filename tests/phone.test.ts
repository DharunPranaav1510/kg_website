import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeIndianMobile, normalizeEmail, formatPhone } from "../src/lib/phone";
import { parseAddress } from "../src/lib/address";
import { evaluateOrderLimits, orderFingerprint, type OrderStats } from "../src/lib/guard";

test("accepts common Indian mobile formats", () => {
  for (const ok of ["9677833339", "+91 96778 33339", "096778 33339", "91-9677833339", "0091 9677833339", "+919677833339"]) {
    assert.equal(normalizeIndianMobile(ok), "+919677833339", ok);
  }
});

test("rejects invalid or dummy numbers", () => {
  for (const bad of ["", "12345", "5677833339", "96778333390", "9999999999", "9876543210", "9898989898", "+44 7911 123456", "abcdefghij", "96778 3333x", "+91+9677833339", "9677833339 ext 5"]) {
    assert.equal(normalizeIndianMobile(bad), null, bad);
  }
});

test("formats phone", () => assert.equal(formatPhone("+919677833339"), "+91 96778 33339"));

test("email is optional but validated", () => {
  assert.equal(normalizeEmail("  "), undefined);
  assert.equal(normalizeEmail("A@b.co"), "a@b.co");
  assert.equal(normalizeEmail("nope"), null);
  assert.equal(normalizeEmail("a@b"), null);
});

test("address validation", () => {
  const ok = parseAddress({ house: "12", street: "2nd Cross", area: "Anna Nagar", pincode: "635109", lat: 12.73, lng: 77.82 });
  assert.ok("value" in ok && ok.value.lat === 12.73);
  assert.ok("value" in parseAddress({ house: "1", street: "Main road", area: "Mathigiri" })); // pincode defaults
  const bad = parseAddress({ house: "", street: "x", area: "y" });
  assert.ok("error" in bad && bad.field === "house");
  const badPin = parseAddress({ house: "1", street: "Main road", area: "Mathigiri", pincode: "12" });
  assert.ok("error" in badPin && badPin.field === "pincode");
  const noGps = parseAddress({ house: "1", street: "Main road", area: "Mathigiri", lat: 80, lng: 10 });
  assert.ok("value" in noGps && noGps.value.lat === undefined);
});

const clean: OrderStats = { blocked: false, phoneOpen: 0, phoneLastHour: 0, phoneLastDay: 0, ipLastHour: 0, ipLastDay: 0, duplicate: false };

test("order limits", () => {
  assert.equal(evaluateOrderLimits(clean).ok, true);
  assert.equal(evaluateOrderLimits({ ...clean, blocked: true }).ok, false);
  assert.equal(evaluateOrderLimits({ ...clean, duplicate: true }).ok, false);
  assert.equal(evaluateOrderLimits({ ...clean, phoneOpen: 2 }).ok, false);
  assert.equal(evaluateOrderLimits({ ...clean, phoneOpen: 1 }).ok, true);
  assert.equal(evaluateOrderLimits({ ...clean, phoneLastHour: 3 }).ok, false);
  assert.equal(evaluateOrderLimits({ ...clean, phoneLastDay: 6 }).ok, false);
  assert.equal(evaluateOrderLimits({ ...clean, ipLastHour: 10 }).ok, false);
  assert.equal(evaluateOrderLimits({ ...clean, ipLastDay: 30 }).ok, false);
});

test("fingerprint ignores order of items", () => {
  assert.equal(
    orderFingerprint([{ id: "a", weightKg: 1 }, { id: "b", weightKg: 0.5 }]),
    orderFingerprint([{ id: "b", weightKg: 0.5 }, { id: "a", weightKg: 1 }])
  );
});
