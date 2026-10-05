// Optional Cloudflare Turnstile (free CAPTCHA alternative). Switched on by
// setting NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. When either
// is missing it is skipped, so the site keeps working without it.

export const turnstileEnabled = () =>
  !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export async function verifyTurnstile(
  token: unknown,
  ip: string | null,
  fetchImpl: typeof fetch = fetch,
  secret = process.env.TURNSTILE_SECRET_KEY
): Promise<boolean> {
  if (!secret) return true; // not configured: nothing to verify
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile verification failed:", e);
    return false;
  }
}
