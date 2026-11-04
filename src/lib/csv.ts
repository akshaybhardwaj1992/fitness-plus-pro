/** Rows → CSV text (RFC 4180 quoting). Arrays/objects are written as JSON. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const cell = (v: unknown): string => {
    if (v == null) return "";
    let s = typeof v === "object" ? JSON.stringify(v) : String(v);
    // Stop spreadsheet apps from treating a cell as a formula.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\r\n");
}
