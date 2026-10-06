import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwner } from "../src/lib/owner";

test("only the owner email counts, case-insensitively", () => {
  assert.equal(isOwner("dpranaav@gmail.com"), true);
  assert.equal(isOwner(" DPranaav@Gmail.com "), true);
  assert.equal(isOwner("dpranaav@gmail.com.evil.com"), false);
  assert.equal(isOwner("someone@gmail.com"), false);
  assert.equal(isOwner(null), false);
});
