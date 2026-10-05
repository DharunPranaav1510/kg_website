// Admin-only helper: turn a database error into something the owner can act on.
export function dbDetail(error: { message?: string } | null | undefined): string | undefined {
  const msg = error?.message;
  if (!msg) return undefined;
  if (/does not exist|schema cache|Could not find/i.test(msg)) {
    return `${msg}. The database is missing something: run the latest supabase/schema.sql in the Supabase SQL Editor.`;
  }
  return msg;
}
