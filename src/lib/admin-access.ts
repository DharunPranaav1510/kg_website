// Pure rules for admin sessions with two-step login, kept free of any
// framework code so they can be unit-tested.

/** Reads the "aal" (assurance level) claim of a Supabase access token. aal2 = passed the 2nd step. */
export function decodeAal(jwt: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.aal === "string" ? payload.aal : null;
  } catch {
    return null;
  }
}

export type Access = "ok" | "deny" | "setup";

/**
 * - Has two-step login but this session only used a password: deny.
 *   (A stolen or half-finished login can't act as the admin.)
 * - No two-step login yet but it's required for everyone: force setup.
 */
export function decideAccess(opts: { aal: string | null; hasVerifiedFactor: boolean; requireMfa: boolean }): Access {
  if (opts.hasVerifiedFactor && opts.aal !== "aal2") return "deny";
  if (!opts.hasVerifiedFactor && opts.requireMfa) return "setup";
  return "ok";
}
