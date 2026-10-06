import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_HOURS, shopNow, summarizeHours, validateHours, type OpeningHours } from "../src/lib/hours";

const on = { open: true, message: "" };
const at = (s: string) => Date.parse(`${s}+05:30`); // 2026-10-05 is a Monday

test("default hours are 6:30 AM to 5 PM every day", () => {
  assert.equal(summarizeHours(DEFAULT_HOURS).display, "6:30 AM – 5:00 PM");
  assert.equal(summarizeHours(DEFAULT_HOURS).days, "Monday – Sunday");
});

test("open inside the hours, closed before and after", () => {
  assert.equal(shopNow(DEFAULT_HOURS, on, at("2026-10-05T06:29:00")).reason, "before_open");
  const open = shopNow(DEFAULT_HOURS, on, at("2026-10-05T06:30:00"));
  assert.equal(open.open, true);
  assert.equal(open.closesAt, "5:00 PM");
  assert.equal(shopNow(DEFAULT_HOURS, on, at("2026-10-05T16:59:00")).open, true);
  const late = shopNow(DEFAULT_HOURS, on, at("2026-10-05T17:00:00"));
  assert.equal(late.reason, "after_close");
  assert.equal(late.opensLabel, "tomorrow at 6:30 AM");
});

test("before opening says today", () => {
  assert.equal(shopNow(DEFAULT_HOURS, on, at("2026-10-05T05:00:00")).opensLabel, "today at 6:30 AM");
});

test("a day off points to the next open day", () => {
  const h: OpeningHours = { ...DEFAULT_HOURS, week: DEFAULT_HOURS.week.map((d, i) => (i === 1 ? { ...d, open: false } : d)) };
  const s = shopNow(h, on, at("2026-10-05T10:00:00"));
  assert.equal(s.reason, "day_off");
  assert.equal(s.opensLabel, "tomorrow at 6:30 AM");
  const sat = shopNow({ ...h, week: h.week.map((d, i) => (i === 0 ? { ...d, open: false } : d)) }, on, at("2026-10-04T10:00:00"));
  assert.equal(sat.opensLabel, "Tuesday at 6:30 AM");
});

test("special days override the week", () => {
  const h: OpeningHours = { ...DEFAULT_HOURS, exceptions: [{ date: "2026-10-05", closed: true, note: "Festival" }, { date: "2026-10-06", closed: false, from: "08:00", to: "12:00" }] };
  const holiday = shopNow(h, on, at("2026-10-05T10:00:00"));
  assert.equal(holiday.reason, "holiday");
  assert.match(holiday.message, /Festival/);
  assert.equal(shopNow(h, on, at("2026-10-06T07:00:00")).open, false);
  assert.equal(shopNow(h, on, at("2026-10-06T09:00:00")).closesAt, "12:00 PM");
});

test("the pause switch beats the opening hours", () => {
  const s = shopNow(DEFAULT_HOURS, { open: false, message: "Sold out" }, at("2026-10-05T10:00:00"));
  assert.equal(s.open, false);
  assert.equal(s.reason, "paused");
  assert.equal(s.message, "Sold out");
});

test("validation", () => {
  assert.equal(validateHours(DEFAULT_HOURS).ok, true);
  assert.equal(validateHours({ week: [] }).ok, false);
  const bad = { ...DEFAULT_HOURS, week: DEFAULT_HOURS.week.map((d, i) => (i === 2 ? { open: true, from: "17:00", to: "06:30" } : d)) };
  assert.equal(validateHours(bad).ok, false);
  assert.equal(validateHours({ ...DEFAULT_HOURS, week: DEFAULT_HOURS.week.map((d) => ({ ...d, open: false })) }).ok, false);
  assert.equal(validateHours({ ...DEFAULT_HOURS, exceptions: [{ date: "nope", closed: true }] }).ok, false);
  const dup = { date: "2026-10-05", closed: true };
  assert.equal(validateHours({ ...DEFAULT_HOURS, exceptions: [dup, dup] }).ok, false);
});

test("summary groups days with the same hours", () => {
  const h: OpeningHours = { ...DEFAULT_HOURS, week: DEFAULT_HOURS.week.map((d, i) => (i === 0 ? { ...d, open: false } : d)) };
  const s = summarizeHours(h);
  assert.deepEqual(s.lines, ["Monday – Saturday: 6:30 AM – 5:00 PM", "Sunday: Closed"]);
  assert.equal(s.days, "Monday – Saturday");
});
