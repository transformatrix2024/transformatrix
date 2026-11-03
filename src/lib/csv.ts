// Builds a CSV download. Values that start with = + - @ are prefixed with '
// so spreadsheet apps don't run them as formulas.
export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let s = value === null || value === undefined ? "" : String(value);
          if (/^[=+\-@]/.test(s)) s = `'${s}`;
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}

export function csvResponse(filename: string, rows: (string | number | null | undefined)[][]) {
  // BOM so Excel opens UTF-8 (names in Hindi etc.) correctly.
  return new Response(`﻿${toCsv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
