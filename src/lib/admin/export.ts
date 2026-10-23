import "server-only";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { csvResponse } from "./csv";

/* ───────────────────────────────────────────────────────────────
   Exportar una tabla del panel en CSV, Excel (.xlsx) o PDF (para ver).
   Las columnas marcadas como dinero salen como número en Excel.
─────────────────────────────────────────────────────────────── */

export type ExportFormat = "csv" | "xlsx" | "pdf";
export type ExportColumn = { title: string; money?: boolean; width?: number; pdf?: boolean };
type Cell = string | number | null | undefined;

export const readFormat = (v: string | null): ExportFormat => (v === "xlsx" || v === "pdf" ? v : "csv");

export async function exportResponse(
  format: ExportFormat,
  { name, title, columns, rows }: { name: string; title: string; columns: ExportColumn[]; rows: Cell[][] },
) {
  if (format === "csv") return csvResponse(`${name}.csv`, [columns.map((c) => c.title), ...rows]);
  if (format === "xlsx") return xlsx(name, title, columns, rows);
  return pdf(name, title, columns, rows);
}

async function xlsx(name: string, title: string, columns: ExportColumn[], rows: Cell[][]) {
  const book = new ExcelJS.Workbook();
  book.creator = "Grain & Grains";
  const sheet = book.addWorksheet(title, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({
    header: c.title,
    width: c.width ?? Math.min(40, Math.max(12, c.title.length + 4)),
    style: c.money ? { numFmt: '"S/" #,##0.00' } : {},
  }));
  for (const r of rows)
    sheet.addRow(r.map((v, i) => (columns[i].money && v !== "" && v != null ? Number(v) : v ?? "")));
  const head = sheet.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1E1E" } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  const data = await book.xlsx.writeBuffer();
  return new Response(data as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

/* Las fuentes estándar del PDF solo tienen letras latinas: lo demás se aproxima */
const latin = (v: Cell) =>
  String(v ?? "")
    .replace(/×/g, "x")
    .replace(/[^\x20-\x7E -ÿ]/g, "?");

function pdf(name: string, title: string, columns: ExportColumn[], rows: Cell[][]) {
  const shown = columns.map((c, i) => [c, i] as const).filter(([c]) => c.pdf !== false);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const now = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
  doc.setFont("helvetica", "bold").setFontSize(14).text(latin(`Grain & Grains · ${title}`), 32, 36);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(110).text(latin(`${rows.length} ${rows.length === 1 ? "fila" : "filas"} · ${now}`), 32, 50);
  autoTable(doc, {
    startY: 62,
    margin: { left: 32, right: 32 },
    head: [shown.map(([c]) => latin(c.title))],
    body: rows.map((r) => shown.map(([c, i]) => (c.money && r[i] !== "" && r[i] != null ? `S/ ${Number(r[i]).toFixed(2)}` : latin(r[i])))),
    styles: { font: "helvetica", fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: Object.fromEntries(shown.map(([c], j) => [j, c.money ? { halign: "right" as const } : {}])),
  });
  return new Response(doc.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
