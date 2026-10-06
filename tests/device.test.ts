import assert from "node:assert/strict";
import test from "node:test";
import { isPhoneUserAgent, mobileTarget, wantsMobile } from "../src/lib/device";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36";

test("phones are detected, tablets and desktops are not", () => {
  assert.equal(isPhoneUserAgent(IPHONE), true);
  assert.equal(isPhoneUserAgent(ANDROID), true);
  assert.equal(isPhoneUserAgent(ANDROID_TABLET), false);
  assert.equal(isPhoneUserAgent(IPAD), false);
  assert.equal(isPhoneUserAgent(DESKTOP), false);
  assert.equal(isPhoneUserAgent(null), false);
});

test("an explicit choice beats the user agent", () => {
  assert.equal(wantsMobile("desktop", IPHONE), false);
  assert.equal(wantsMobile("mobile", DESKTOP), true);
  assert.equal(wantsMobile(null, IPHONE), true);
});

test("only customer pages with a phone version are mapped", () => {
  assert.equal(mobileTarget("/"), "/m");
  assert.equal(mobileTarget("/shop"), "/m/shop");
  assert.equal(mobileTarget("/order/abc-123"), "/m/order/abc-123");
  assert.equal(mobileTarget("/privacy"), "/m/legal/privacy");
  assert.equal(mobileTarget("/policies"), "/m/more");
  assert.equal(mobileTarget("/about"), null);
  assert.equal(mobileTarget("/order/a/b"), null);
});
