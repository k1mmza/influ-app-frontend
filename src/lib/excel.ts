type ExcelCell = string | number;

interface ExcelExportOptions {
  filename: string;
  sheetName: string; // kept for call-site compatibility; CSV has no sheet name
  headers: string[];
  rows: ExcelCell[][];
}

// RFC-4180 quoting: wrap a field in double quotes when it contains a comma,
// quote, or line break, and double any embedded quotes.
const escapeCsv = (value: ExcelCell) => {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Download tabular data as a real CSV file.
 *
 * Previously this emitted an HTML <table> with an `.xls` extension. Windows
 * Excel tolerates that ("HTML masquerading as Excel"), but macOS opens `.xls`
 * in Numbers, which does NOT parse HTML-as-xls and instead shows the raw markup.
 * CSV is a genuine spreadsheet format that opens correctly in Excel, Numbers,
 * and Google Sheets alike — so this works cross-platform.
 *
 * A UTF-8 BOM is prepended so Excel on Windows detects UTF-8 (otherwise Thai /
 * non-ASCII text shows as mojibake); CRLF line endings match the CSV spec.
 */
export function exportRowsToExcel({ filename, headers, rows }: ExcelExportOptions) {
  const BOM = "\uFEFF";
  const csv =
    BOM +
    [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  // Normalize any legacy .xls/.xlsx (or existing .csv) suffix to a single .csv.
  anchor.download = filename.replace(/\.(xlsx?|csv)$/i, "") + ".csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
