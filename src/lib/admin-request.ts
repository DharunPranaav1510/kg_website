// Checks for the "request admin access" form on the sign-in page. Pure, so it can be tested.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface AdminRequestInput {
  email: string;
  name: string;
  password: string;
  note: string;
}

export function parseAdminRequest(body: unknown): { ok: true; value: AdminRequestInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 200) : "";
  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const password = typeof b.password === "string" ? b.password : "";
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 200) : "";
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!EMAIL.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 10) return { ok: false, error: "Choose a password of at least 10 characters." };
  if (password.length > 72) return { ok: false, error: "Use a password of at most 72 characters." };
  return { ok: true, value: { email, name, password, note } };
}
