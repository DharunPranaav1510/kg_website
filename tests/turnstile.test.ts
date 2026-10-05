import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstile } from "../src/lib/turnstile";

const fakeFetch = (reply: unknown, ok = true) =>
  (async () => ({ ok, json: async () => reply })) as unknown as typeof fetch;

test("skips verification when no secret is configured", async () => {
  assert.equal(await verifyTurnstile(undefined, null, fakeFetch({}), undefined), true);
});

test("accepts a good token and rejects bad ones", async () => {
  const tok = "x".repeat(40);
  assert.equal(await verifyTurnstile(tok, "1.2.3.4", fakeFetch({ success: true }), "secret"), true);
  assert.equal(await verifyTurnstile(tok, null, fakeFetch({ success: false }), "secret"), false);
  assert.equal(await verifyTurnstile("", null, fakeFetch({ success: true }), "secret"), false);
  assert.equal(await verifyTurnstile(undefined, null, fakeFetch({ success: true }), "secret"), false);
  assert.equal(await verifyTurnstile(tok, null, fakeFetch({}, false), "secret"), false);
  const boom = (async () => { throw new Error("network"); }) as unknown as typeof fetch;
  assert.equal(await verifyTurnstile(tok, null, boom, "secret"), false);
});
