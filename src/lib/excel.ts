type ExcelCell = string | number;

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: ExcelCell[][];
}

const escapeHtml = (value: ExcelCell) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function exportRowsToExcel({ filename, sheetName, headers, rows }: ExcelExportOptions) {
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  const htmlWorkbook = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(sheetName)}</title>
  </head>
  <body>
    <table>
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </body>
</html>`;

  const blob = new Blob([htmlWorkbook], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
}
