// Rules for a new admin's password. Pure, so the browser can show the same hints the server enforces.

const COMMON = new Set([
  "password", "password1", "password12", "password123", "passw0rd", "qwerty", "qwerty123", "qwertyuiop",
  "123456789", "1234567890", "12345678910", "iloveyou", "welcome1", "welcome123", "admin123", "administrator",
  "letmein", "letmein123", "abc123456", "changeme", "monkey123", "dragon123", "football1", "kgfoods",
  "kgmeatmart", "kgfoods123", "hosur123", "chicken123", "mutton123",
]);

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 72; // longer is silently cut short by the password hashing

export interface PasswordCheck {
  ok: boolean;
  /** The first thing to fix, in plain words. */
  problem: string;
  rules: { label: string; ok: boolean }[];
}

export function checkPassword(password: string, email = ""): PasswordCheck {
  const lower = password.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const rules = [
    { label: `At least ${PASSWORD_MIN} characters`, ok: password.length >= PASSWORD_MIN },
    { label: "A letter and a number", ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
    { label: "Not a common password, and does not contain your email name", ok: !COMMON.has(lower) && !(local.length >= 4 && lower.includes(local)) && !/^(.)\1+$/.test(password) },
  ];
  if (password.length > PASSWORD_MAX) return { ok: false, problem: `Use at most ${PASSWORD_MAX} characters.`, rules };
  const bad = rules.find((r) => !r.ok);
  return { ok: !bad, problem: bad ? bad.label.replace(/^At least/, "Use at least").replace(/^A letter/, "Include a letter").replace(/^Not a/, "Choose something that is not a") : "", rules };
}
