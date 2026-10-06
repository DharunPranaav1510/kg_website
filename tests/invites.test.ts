import assert from "node:assert/strict";
import test from "node:test";
import { hashOtp, hashToken, inviteStatus, isOpenInvite, maskEmail, newOtp, newToken, otpMatches } from "../src/lib/invites";
import { checkPassword } from "../src/lib/password";

test("invite tokens are long, unique and only their hash is stored", () => {
  const a = newToken();
  const b = newToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 43); // 256 bits
  assert.match(a, /^[A-Za-z0-9_-]+$/); // safe inside a URL
  assert.equal(hashToken(a).length, 64);
  assert.notEqual(hashToken(a), a);
  assert.equal(hashToken(a), hashToken(a));
});

test("codes are six digits and tied to their invite", () => {
  for (let i = 0; i < 200; i++) assert.match(newOtp(), /^\d{6}$/);
  const t1 = hashToken("one");
  const t2 = hashToken("two");
  const stored = hashOtp(t1, "123456");
  assert.equal(otpMatches(t1, "123456", stored), true);
  assert.equal(otpMatches(t1, "123457", stored), false);
  assert.equal(otpMatches(t2, "123456", stored), false); // the same code does not work on another invite
  assert.equal(otpMatches(t1, "12345", stored), false);
  assert.equal(otpMatches(t1, "abcdef", stored), false);
  assert.equal(otpMatches(t1, "123456", null), false);
});

test("email addresses are masked on the invite page", () => {
  assert.equal(maskEmail("dharun@gmail.com"), "d•••••@gmail.com");
  assert.equal(maskEmail("ab@x.in"), "a••@x.in");
  assert.equal(maskEmail("not-an-email"), "not-an-email");
});

test("invite status", () => {
  const now = Date.parse("2026-10-06T10:00:00Z");
  const base = { expires_at: "2026-10-07T10:00:00Z", used_at: null, revoked_at: null, otp_expires_at: null };
  assert.equal(inviteStatus(base, now), "waiting");
  assert.equal(inviteStatus({ ...base, otp_expires_at: "2026-10-06T10:05:00Z" }, now), "code_sent");
  assert.equal(inviteStatus({ ...base, otp_expires_at: "2026-10-06T09:55:00Z" }, now), "waiting"); // the code itself expired
  assert.equal(inviteStatus({ ...base, expires_at: "2026-10-06T09:00:00Z" }, now), "expired");
  assert.equal(inviteStatus({ ...base, used_at: "2026-10-06T09:00:00Z" }, now), "accepted");
  assert.equal(inviteStatus({ ...base, revoked_at: "2026-10-06T09:00:00Z" }, now), "revoked");
  assert.equal(isOpenInvite(base, now), true);
  assert.equal(isOpenInvite({ ...base, used_at: "x" }, now), false);
});

test("password rules", () => {
  assert.equal(checkPassword("short1").ok, false);
  assert.equal(checkPassword("onlyletterslongenough").ok, false); // no number
  assert.equal(checkPassword("123456789012").ok, false); // no letter
  assert.equal(checkPassword("Password123").ok, false); // too short
  assert.equal(checkPassword("aaaaaaaaaaaa1").ok, true); // long enough, has both
  assert.equal(checkPassword("kgfoods123", "").ok, false);
  assert.equal(checkPassword("dharunpranaav99Z", "dharunpranaav@gmail.com").ok, false); // contains the email name
  assert.equal(checkPassword("Blue-Tractor-Lamp-2026", "dharunpranaav@gmail.com").ok, true);
  assert.equal(checkPassword("x".repeat(80) + "1").ok, false); // longer than the hasher accepts
  assert.match(checkPassword("short1").problem, /at least 12/i);
});
