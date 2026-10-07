import { clock12, DAY_NAMES, istParts } from "@/lib/pricing";

// ---------------------------------------------------------------------------
// Opening hours: a weekly timetable plus special days (holidays, different hours on a date).
// All times are Indian time. Pure, so the shop, the server and the admin panel agree.
// ---------------------------------------------------------------------------

export interface DayHours {
  open: boolean;
  /** "HH:MM" */
  from: string;
  to: string;
}

export interface HoursException {
  /** "YYYY-MM-DD" */
  date: string;
  closed: boolean;
  from?: string;
  to?: string;
  note?: string;
}

export interface OpeningHours {
  /** Index 0 = Sunday ... 6 = Saturday */
  week: DayHours[];
  exceptions: HoursException[];
}

export const DEFAULT_HOURS: OpeningHours = {
  week: Array.from({ length: 7 }, () => ({ open: true, from: "06:30", to: "17:00" })),
  exceptions: [],
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateHours(input: unknown): Checked<OpeningHours> {
  const h = (input ?? {}) as { week?: unknown; exceptions?: unknown };
  if (!Array.isArray(h.week) || h.week.length !== 7) return { ok: false, error: "Set the hours for all seven days." };
  const week: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    const d = h.week[i] as Partial<DayHours> | null;
    const open = d?.open === true;
    const from = typeof d?.from === "string" ? d.from : "";
    const to = typeof d?.to === "string" ? d.to : "";
    if (open) {
      if (!TIME.test(from) || !TIME.test(to)) return { ok: false, error: `Enter the opening and closing time for ${DAY_NAMES[i]}.` };
      if (toMin(from) >= toMin(to)) return { ok: false, error: `${DAY_NAMES[i]} must close after it opens.` };
    }
    week.push({ open, from: TIME.test(from) ? from : "06:30", to: TIME.test(to) ? to : "17:00" });
  }
  if (!week.some((d) => d.open)) return { ok: false, error: "At least one day must be open. To stop taking orders for a while, use Pause orders instead." };

  const raw = Array.isArray(h.exceptions) ? (h.exceptions as Partial<HoursException>[]) : [];
  if (raw.length > 80) return { ok: false, error: "That is too many special days. Remove the old ones." };
  const seen = new Set<string>();
  const exceptions: HoursException[] = [];
  for (const e of raw) {
    const date = typeof e?.date === "string" ? e.date : "";
    if (!DATE.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: "A special day has an invalid date." };
    if (seen.has(date)) return { ok: false, error: `${date} is listed twice.` };
    seen.add(date);
    const closed = e?.closed !== false;
    const note = typeof e?.note === "string" ? e.note.trim().slice(0, 80) : "";
    if (closed) {
      exceptions.push({ date, closed: true, note: note || undefined });
    } else {
      const from = typeof e?.from === "string" ? e.from : "";
      const to = typeof e?.to === "string" ? e.to : "";
      if (!TIME.test(from) || !TIME.test(to) || toMin(from) >= toMin(to)) return { ok: false, error: `Check the special hours for ${date}.` };
      exceptions.push({ date, closed: false, from, to, note: note || undefined });
    }
  }
  exceptions.sort((a, b) => a.date.localeCompare(b.date));
  return { ok: true, value: { week, exceptions } };
}

// ---- date helpers (calendar dates only, so no time zone surprises) ----
const parseDate = (d: string) => new Date(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(parseDate(d).getTime() + n * 86400000).toISOString().slice(0, 10);
const weekday = (d: string) => parseDate(d).getUTCDay();

/** The hours that apply on a calendar date, or null when the shop is shut that day. */
export function hoursOn(h: OpeningHours, date: string): { from: string; to: string; special: boolean; note?: string } | null {
  const ex = h.exceptions.find((e) => e.date === date);
  if (ex) return ex.closed ? null : { from: ex.from!, to: ex.to!, special: true, note: ex.note };
  const d = h.week[weekday(date)];
  return d.open ? { from: d.from, to: d.to, special: false } : null;
}

// ---- right now ----
export interface ManualStatus {
  open: boolean;
  message: string;
  /**
   * "YYYY-MM-DD" (Indian date) on which the owner opened the shop outside its hours.
   * It only counts on that exact date, so the next day the normal hours apply again.
   */
  forceOpenOn?: string;
}

export type ClosedReason = "paused" | "holiday" | "day_off" | "before_open" | "after_close";

export interface LiveShopStatus {
  /** Taking orders at this moment. */
  open: boolean;
  reason: "open" | ClosedReason;
  /** A sentence for customers. */
  message: string;
  /** Short line for badges: "Open · closes 5:00 PM", "Closed · opens tomorrow at 6:30 AM". */
  label: string;
  /** Text for a disabled Add button. */
  blockedLabel: string;
  closesAt: string | null;
  minutesToClose: number | null;
  /** "today at 6:30 AM", "tomorrow at 6:30 AM", "Monday at 6:30 AM" */
  opensLabel: string | null;
  /** When it opens next, as a timestamp (for a countdown). */
  opensAt: number | null;
  /** Open only because the owner opened it outside the usual hours for today. */
  extended: boolean;
}

const atIst = (date: string, time: string) => Date.parse(`${date}T${time}:00+05:30`);

function nextOpening(h: OpeningHours, today: string, minutes: number): { label: string; at: number } | null {
  const t = hoursOn(h, today);
  if (t && minutes < toMin(t.from)) return { label: `today at ${clock12(t.from)}`, at: atIst(today, t.from) };
  for (let i = 1; i <= 21; i++) {
    const d = addDays(today, i);
    const x = hoursOn(h, d);
    if (x) return { label: `${i === 1 ? "tomorrow" : DAY_NAMES[weekday(d)]} at ${clock12(x.from)}`, at: atIst(d, x.from) };
  }
  return null;
}

export function shopNow(h: OpeningHours, manual: ManualStatus, now: number | Date = Date.now()): LiveShopStatus {
  const t = istParts(now);
  const today = hoursOn(h, t.date);
  const next = nextOpening(h, t.date, t.minutes);
  const opens = next?.label ?? null;
  const closed = (reason: ClosedReason, message: string): LiveShopStatus => ({
    open: false,
    reason,
    message,
    label: reason === "paused" ? "Orders paused" : opens ? `Closed · opens ${opens}` : "Closed",
    blockedLabel: reason === "paused" ? "Orders paused" : opens ? `Opens ${opens.replace("today at ", "").replace("tomorrow at ", "tomorrow ")}` : "Closed now",
    closesAt: null,
    minutesToClose: null,
    opensLabel: reason === "paused" ? null : opens,
    opensAt: reason === "paused" ? null : next?.at ?? null,
    extended: false,
  });

  if (!manual.open) return closed("paused", manual.message || "Orders are paused right now. Please check back soon.");

  if (today && t.minutes >= toMin(today.from) && t.minutes < toMin(today.to)) {
    const left = toMin(today.to) - t.minutes;
    return {
      open: true,
      reason: "open",
      message: `We're open until ${clock12(today.to)}.`,
      label: `Open · closes ${clock12(today.to)}`,
      blockedLabel: "",
      closesAt: clock12(today.to),
      minutesToClose: left,
      opensLabel: null,
      opensAt: null,
      extended: false,
    };
  }

  // The owner opened the shop outside its hours for today only. The date check is what
  // makes it end by itself: tomorrow the date no longer matches.
  if (manual.forceOpenOn === t.date) {
    return {
      open: true,
      reason: "open",
      message: "We're open late today.",
      label: "Open late today",
      blockedLabel: "",
      closesAt: "midnight",
      minutesToClose: 24 * 60 - t.minutes,
      opensLabel: null,
      opensAt: null,
      extended: true,
    };
  }

  const ex = h.exceptions.find((e) => e.date === t.date);
  const nextText = opens ? ` We open ${opens}.` : "";
  if (ex?.closed) return closed("holiday", `We're closed today${ex.note ? ` (${ex.note})` : ""}.${nextText}`);
  if (!today) return closed("day_off", `We're closed today.${nextText}`);
  if (t.minutes < toMin(today.from)) return closed("before_open", `We open today at ${clock12(today.from)}.`);
  return closed("after_close", `We're closed for today.${nextText}`);
}

// ---- text for places that show the hours ----
export interface HoursSummary {
  /** "6:30 AM – 5:00 PM", or "Varies by day" */
  display: string;
  /** "Monday – Sunday", "Monday – Saturday", or the days listed */
  days: string;
  /** One line per run of days with the same hours, for lists. */
  lines: string[];
}

export function summarizeHours(h: OpeningHours): HoursSummary {
  const label = (d: DayHours) => (d.open ? `${clock12(d.from)} – ${clock12(d.to)}` : "Closed");
  // Monday first, as people read a week.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const runs: { from: number; to: number; text: string }[] = [];
  order.forEach((day, i) => {
    const text = label(h.week[day]);
    const last = runs[runs.length - 1];
    if (last && last.text === text && last.to === i - 1) last.to = i;
    else runs.push({ from: i, to: i, text });
  });
  const dayName = (i: number) => DAY_NAMES[order[i]];
  const lines = runs.map((r) => `${r.from === r.to ? dayName(r.from) : `${dayName(r.from)} – ${dayName(r.to)}`}: ${r.text}`);

  const openRuns = runs.filter((r) => r.text !== "Closed");
  const sameEverywhere = new Set(openRuns.map((r) => r.text)).size === 1;
  const display = sameEverywhere ? openRuns[0].text : "Varies by day";
  const days = sameEverywhere
    ? openRuns.map((r) => (r.from === r.to ? dayName(r.from) : `${dayName(r.from)} – ${dayName(r.to)}`)).join(", ")
    : "see opening hours";
  return { display, days, lines };
}

/** Day-by-day slots in the shape the rest of the site (and Google) expects. */
export function slotsFromWeek(h: OpeningHours): { day: string; open: string; close: string }[] {
  return DAY_NAMES.map((day, i) => ({ day, open: h.week[i].open ? clock12(h.week[i].from) : "Closed", close: h.week[i].open ? clock12(h.week[i].to) : "Closed" })).filter((s) => s.open !== "Closed");
}
