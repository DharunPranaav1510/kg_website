// Indian mobile numbers only. Shared by the browser (instant feedback) and the
// server (the check that actually counts).

/**
 * Returns the number as "+91XXXXXXXXXX", or null if it is not a plausible
 * Indian mobile number. Accepts spaces, dashes, "+91", "91", "0091" and a
 * leading "0".
 */
export function normalizeIndianMobile(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, "");
  if (!d || /[^\d+]/.test(d) || d.lastIndexOf("+") > 0) return null;

  if (d.startsWith("+")) {
    if (!d.startsWith("+91")) return null;
    d = d.slice(3);
  } else if (d.startsWith("0091")) {
    d = d.slice(4);
  } else if (d.length === 12 && d.startsWith("91")) {
    d = d.slice(2);
  } else if (d.length === 11 && d.startsWith("0")) {
    d = d.slice(1);
  }

  // Mobile numbers start with 6-9 and have exactly 10 digits.
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  // Obvious dummy numbers: 9999999999, 9876543210, 9012345678 ...
  if (/^(\d)\1{9}$/.test(d)) return null;
  if ("0123456789".includes(d) || "9876543210".includes(d)) return null;
  if (new Set(d).size <= 2) return null;

  return `+91${d}`;
}

export function isValidIndianMobile(input: string): boolean {
  return normalizeIndianMobile(input) !== null;
}

/** "+919876543210" -> "+91 98765 43210" */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** Optional email: empty is fine, anything else must look like an address. */
export function normalizeEmail(input: string): string | null | undefined {
  const e = input.trim().toLowerCase();
  if (!e) return undefined; // not provided
  if (e.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return null; // invalid
  return e;
}
