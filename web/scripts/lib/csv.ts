/* Minimal RFC 4180 CSV, both directions.
 *
 * Hand-rolled rather than pulled from npm because the import path runs against
 * the production database and every dependency there is a supply-chain risk
 * for a file we can write in forty lines.
 *
 * Excel on Windows only reads a UTF-8 file as UTF-8 when it starts with a BOM,
 * and this data is almost entirely Thai — so `toCsv` writes one and `parseCsv`
 * strips whatever the team's spreadsheet put back.
 */

export const BOM = '﻿';

/** Quote a cell only when it needs it, doubling any embedded quote. */
function cell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: string[][]): string {
  return BOM + rows.map((r) => r.map((c) => cell(c ?? '')).join(',')).join('\r\n') + '\r\n';
}

/** Rows of raw strings. Blank trailing lines are dropped, nothing is trimmed. */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else quoted = false;
      } else field += c;
      continue;
    }

    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue; // CRLF and lone CR both end the line on the \n
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
