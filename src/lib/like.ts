/**
 * Turn text into an ILIKE pattern that matches only that exact text.
 * Without this, "_" and "%" in an email act as wildcards: someone who registers
 * "d_ranaav@example.com" would match the admin "dpranaav@example.com".
 */
export const exactLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);
