/**
 * One quoted CSV cell. Spreadsheet programs run cells that start with = + - @ (or a tab or carriage return)
 * as formulas, and customers type the name, address and note, so those get a leading apostrophe.
 */
export function csvCell(v: unknown): string {
  const text = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
