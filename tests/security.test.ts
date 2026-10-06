import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffImageType } from "../src/lib/image-sniff";
import { isAllowedImageUrl } from "../src/lib/image-url";
import { csvCell } from "../src/lib/csv";
import { LIMITS, orderFingerprint, raceVerdict, type RankedOrder } from "../src/lib/guard";
import { safeJsonForScript } from "../src/lib/seo";

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

import { peekClaims } from "../src/lib/admin-access";

test("peekClaims reads sub, email and aal without trusting them", () => {
  const t = `h.${Buffer.from(JSON.stringify({ sub: "u1", email: "Owner@KGFoods.in", aal: "aal2" })).toString("base64url")}.s`;
  assert.deepEqual(peekClaims(t), { sub: "u1", email: "owner@kgfoods.in", aal: "aal2" });
  assert.deepEqual(peekClaims("nope"), { sub: null, email: null, aal: null });
});

test("CSV cells cannot run as spreadsheet formulas", () => {
  assert.equal(csvCell("Priya"), '"Priya"');
  assert.equal(csvCell('=HYPERLINK("http://evil")'), `"'=HYPERLINK(""http://evil"")"`);
  assert.equal(csvCell("+91 98765 43210"), `"'+91 98765 43210"`);
  assert.equal(csvCell("-5"), `"'-5"`);
  assert.equal(csvCell("@SUM(A1)"), `"'@SUM(A1)"`);
  assert.equal(csvCell("say \"hi\""), '"say ""hi"""');
  assert.equal(csvCell(null), '""');
});

test("structured data cannot close its script tag", () => {
  const out = safeJsonForScript({ a: "</script><script>alert(1)</script>", b: "x & y" });
  assert.equal(out.includes("<"), false);
  assert.equal(out.includes(">"), false);
  assert.deepEqual(JSON.parse(out), { a: "</script><script>alert(1)</script>", b: "x & y" });
});

function burst(n: number, status = "new", items: RankedOrder["items"] = [{ id: "a", weightKg: 1 }]) {
  const base = Date.now() - 1000;
  return Array.from({ length: n }, (_, i): RankedOrder => ({ id: `id-${String(i).padStart(3, "0")}`, created_at: new Date(base + i).toISOString(), status, items }));
}
const FP = orderFingerprint([{ id: "b", weightKg: 2 }]);

test("simultaneous orders: only the allowed number survive, earlier ones win", () => {
  const orders = burst(6, "new", [{ id: "x", weightKg: 1 }]).map((o, i) => ({ ...o, items: [{ id: `p${i}`, weightKg: 1 }] }));
  const verdicts = orders.map((o) => raceVerdict(o.id, orders, [], FP).ok);
  assert.equal(verdicts.filter(Boolean).length, LIMITS.phoneOpen);
  assert.deepEqual(verdicts.slice(0, LIMITS.phoneOpen), Array(LIMITS.phoneOpen).fill(true)); // the first ones
});

test("simultaneous orders from one device are capped too", () => {
  const ip = burst(15, "confirmed");
  const survivors = ip.filter((o) => raceVerdict(o.id, [], ip, FP).ok);
  assert.equal(survivors.length, LIMITS.ipPerHour);
});

test("cancelled orders do not use up the phone limit", () => {
  const phone = [...burst(5, "cancelled"), ...burst(1, "new").map((o) => ({ ...o, id: "mine", created_at: new Date().toISOString() }))];
  assert.equal(raceVerdict("mine", phone, [], FP).ok, true);
});

test("the same cart sent twice at once keeps only the first", () => {
  const items = [{ id: "b", weightKg: 2 }];
  const two: RankedOrder[] = [
    { id: "a1", created_at: new Date(Date.now() - 200).toISOString(), status: "new", items },
    { id: "a2", created_at: new Date(Date.now() - 100).toISOString(), status: "new", items },
  ];
  assert.equal(raceVerdict("a1", two, [], FP).ok, true);
  const r = raceVerdict("a2", two, [], FP);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 409);
});
