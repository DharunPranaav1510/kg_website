import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAdminRequest } from "../src/lib/admin-request";

const good = { name: "  Priya   Nair ", email: " Priya@Example.com ", password: "a-long-password", note: " I run the counter " };

test("a request is cleaned up and accepted", () => {
  const r = parseAdminRequest(good);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.name, "Priya Nair");
    assert.equal(r.value.email, "priya@example.com");
    assert.equal(r.value.note, "I run the counter");
  }
});

test("a short password, a bad email or no name is refused", () => {
  assert.equal(parseAdminRequest({ ...good, password: "short" }).ok, false);
  assert.equal(parseAdminRequest({ ...good, password: "x".repeat(73) }).ok, false);
  assert.equal(parseAdminRequest({ ...good, email: "not-an-email" }).ok, false);
  assert.equal(parseAdminRequest({ ...good, name: " " }).ok, false);
  assert.equal(parseAdminRequest(null).ok, false);
});

import { exactLike } from "../src/lib/like";

test("exactLike stops _ and % from acting as wildcards in an email match", () => {
  assert.equal(exactLike("d_ranaav@gmail.com"), "d\\_ranaav@gmail.com");
  assert.equal(exactLike("%@gmail.com"), "\\%@gmail.com");
  assert.equal(exactLike("a\\b@x.com"), "a\\\\b@x.com");
  assert.equal(exactLike("plain@x.com"), "plain@x.com");
});
