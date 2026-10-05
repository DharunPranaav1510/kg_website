import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffImageType } from "../src/lib/image-sniff";
import { isAllowedImageUrl } from "../src/lib/image-url";

const bytes = (...n: number[]) => new Uint8Array(n);

test("image type comes from the file bytes", () => {
  assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))?.ext, "jpg");
  assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.ext, "png");
  assert.equal(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))?.ext, "webp");
  // SVG / HTML / empty are refused
  assert.equal(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), null);
  assert.equal(sniffImageType(new TextEncoder().encode("<html><script>alert(1)</script>")), null);
  assert.equal(sniffImageType(bytes()), null);
});

test("product image URLs are limited to our own sources", () => {
  const sb = "https://abc.supabase.co";
  assert.equal(isAllowedImageUrl("/images/products/chicken.jpg", sb), true);
  assert.equal(isAllowedImageUrl(`${sb}/storage/v1/object/public/product-images/x.webp`, sb), true);
  assert.equal(isAllowedImageUrl("https://evil.example/pixel.gif", sb), false);
  assert.equal(isAllowedImageUrl("//evil.example/x.png", sb), false);
  assert.equal(isAllowedImageUrl("/images/../../etc/passwd", sb), false);
  assert.equal(isAllowedImageUrl("javascript:alert(1)", sb), false);
  assert.equal(isAllowedImageUrl(`${sb}/storage/v1/object/public/other-bucket/x.png`, sb), false);
  assert.equal(isAllowedImageUrl("https://abc.supabase.co.evil.example/storage/v1/object/public/product-images/x.png", sb), false);
  assert.equal(isAllowedImageUrl(`${sb}/storage/v1/object/public/product-images/x.png`, undefined), false);
});

import { decideAccess, decodeAal } from "../src/lib/admin-access";

const jwt = (payload: object) => `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;

test("reads the assurance level from a token", () => {
  assert.equal(decodeAal(jwt({ aal: "aal2" })), "aal2");
  assert.equal(decodeAal(jwt({ aal: "aal1" })), "aal1");
  assert.equal(decodeAal(jwt({})), null);
  assert.equal(decodeAal("garbage"), null);
  assert.equal(decodeAal(""), null);
});

test("two-step login rules", () => {
  // enrolled: password-only session is refused, code-verified session is fine
  assert.equal(decideAccess({ aal: "aal1", hasVerifiedFactor: true, requireMfa: false }), "deny");
  assert.equal(decideAccess({ aal: null, hasVerifiedFactor: true, requireMfa: true }), "deny");
  assert.equal(decideAccess({ aal: "aal2", hasVerifiedFactor: true, requireMfa: true }), "ok");
  // not enrolled: optional by default, forced when the owner requires it
  assert.equal(decideAccess({ aal: "aal1", hasVerifiedFactor: false, requireMfa: false }), "ok");
  assert.equal(decideAccess({ aal: "aal1", hasVerifiedFactor: false, requireMfa: true }), "setup");
});
