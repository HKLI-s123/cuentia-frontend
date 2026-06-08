/**
 * Genera el Excel demo de Flujo de Efectivo.
 * Estructura: 10 columnas, 1 hoja, secciones Ingresos/Egresos + Resumen de Liquidez.
 *
 * Reglas:
 *  - Ingresos  = rfc_emisor === RFC_PROPIO
 *  - Egresos   = rfc_emisor !== RFC_PROPIO
 *  - Solo facturas PUE (tipoComp "I") y complementos de pago (tipoComp "P").
 *  - Facturas tipo "E" (notas de crédito) no van aquí.
 *
 * Salida: public/demo/flujo-efectivo-demo.xlsx
 * Uso:    node scripts/generate-demo-flujo-efectivo.mjs
 */

import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../public/demo/flujo-efectivo-demo.xlsx");

const RFC_PROPIO   = "XEME830615XY9";
const FECHA_INICIO = "2026-05-01";
const FECHA_FIN    = "2026-05-31";

// ── 10 headers ────────────────────────────────────────────────────────────────
const HEADERS = [
  "Tipo factura",      // 1  PUE | P
  "Fecha",             // 2
  "UUID",              // 3
  "Contraparte",       // 4
  "RFC Emisor",        // 5
  "RFC Receptor",      // 6
  "Total",             // 7
  "Tipo Comprobante",  // 8
  "Forma Pago",        // 9
  "Estatus",           // 10
];

// Índice 0-based del campo Total en cada fila de datos
const IDX_TOTAL = 6;
const LAST_COL  = "J"; // columna 10

// ── Datos demo ────────────────────────────────────────────────────────────────
// Columnas: [tipoFact, fecha, uuid, contraparte, rfcEmisor, rfcReceptor,
//            total, tipoComp, formaPago, estatus]
//
// Ingresos → rfcEmisor === RFC_PROPIO  (XEME vendió/cobró)
// Egresos  → rfcEmisor !== RFC_PROPIO  (proveedor vendió a XEME / XEME pagó PPD)

const INGRESOS = [
  // ── Facturas PUE emitidas por XEME ───────────────────────────────────────
  ["PUE", "01/05/26", "5F3A8B2C-4E6F-1A2B-3C4D-5E6F7A8B9C0D",
   "Walmart de México SA de CV",
   RFC_PROPIO, "WALMEX860714K84", 100000, "I", "03 - Transferencia", "Vigente"],
  ["PUE", "12/05/26", "9D1E4F7A-8B2C-3D4E-5F6A-7B8C9D0E1F2A",
   "Público en General",
   RFC_PROPIO, "XAXX010101000", 15000, "I", "01 - Efectivo", "Vigente"],
  ["PUE", "22/05/26", "E5F6A7B8-4C5D-7E8F-9A0B-1C2D3E4F5A6B",
   "Servicios Int SA de CV",
   RFC_PROPIO, "SIN900215AB3", 50000, "I", "03 - Transferencia", "Vigente"],
  ["PUE", "28/05/26", "F6A7B8C9-5D6E-8F9A-0B1C-2D3E4F5A6B7C",
   "Consultoría MX SA de CV",
   RFC_PROPIO, "CMX200600J99", 40000, "I", "03 - Transferencia", "Vigente"],
  // ── Complementos de pago cobrados (PPD → XEME cobró) ────────────────────
  ["P", "18/05/26", "C3D4E5F6-3A4B-5C6D-7E8F-9A0B1C2D3E4F",
   "FEMSA Comercio SA de CV",
   RFC_PROPIO, "FCO010122SA5", 80000, "P", "03 - Transferencia", "Vigente"],
  ["P", "20/05/26", "D4E5F6A7-4B5C-6D7E-8F9A-0B1C2D3E4F5A",
   "Grupo Bimbo SAB de CV",
   RFC_PROPIO, "GBI920606P34", 15000, "P", "02 - Cheque", "Vigente"],
];

const EGRESOS = [
  // ── Facturas PUE recibidas por XEME (proveedor las emite, tipoComp "I") ──
  ["PUE", "02/05/26", "A1B2C3D4-1E2F-3A4B-5C6D-7E8F9A0B1C2D",
   "Telmex SA de CV",
   "TME840315KT6", RFC_PROPIO, 2500, "I", "03 - Transferencia", "Vigente"],
  ["PUE", "05/05/26", "B2C3D4E5-2F3A-4B5C-6D7E-8F9A0B1C2D3E",
   "CFE Suministro Básico",
   "CFE370814QI0", RFC_PROPIO, 6000, "I", "03 - Transferencia", "Vigente"],
  ["PUE", "08/05/26", "C3D4E5F6-3A4B-5C6D-7E8F-9A0B1C2D3E4F",
   "Oxxo Comercial SA",
   "OCO820309EN5", RFC_PROPIO, 5000, "I", "01 - Efectivo", "Vigente"],
  ["PUE", "14/05/26", "E5F6A7B8-5C6D-7E8F-9A0B-1C2D3E4F5A6B",
   "Office Depot México SA",
   "ODM961101R48", RFC_PROPIO, 4000, "I", "03 - Transferencia", "Vigente"],
  ["PUE", "25/05/26", "B8C9D0E1-8F9A-0B1C-2D3E-4F5A6B7C8D9E",
   "Papelería Nacional SA",
   "PNA800101XY8", RFC_PROPIO, 1000, "I", "01 - Efectivo", "Vigente"],
  ["PUE", "28/05/26", "C9D0E1F2-9A0B-1C2D-3E4F-5A6B7C8D9E0F",
   "Claro México SA de CV",
   "AMX980101QX3", RFC_PROPIO, 1500, "I", "03 - Transferencia", "Vigente"],
  // ── Complementos de pago enviados (PPD → XEME pagó a proveedor) ──────────
  ["P", "14/05/26", "E5F6A7B8-5C6D-7E8F-9A0B-1C2D3E4F5A6B",
   "Amazon México SC",
   "AME170831G61", RFC_PROPIO, 15000, "P", "03 - Transferencia", "Vigente"],
  ["P", "22/05/26", "F6A7B8C9-6D7E-8F9A-0B1C-2D3E4F5A6B7C",
   "Computación Integral SA",
   "CIN910801ZB3", RFC_PROPIO, 5000, "P", "03 - Transferencia", "Vigente"],
];

// ── Workbook ──────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "CuentIA";
wb.created = new Date();

const ws = wb.addWorksheet("Flujo de Efectivo");

// Fila 1: título principal
const titleRow = ws.addRow([`Flujo de Efectivo — ${RFC_PROPIO} | ${FECHA_INICIO} al ${FECHA_FIN}`]);
ws.mergeCells(`A${titleRow.number}:${LAST_COL}${titleRow.number}`);
titleRow.getCell(1).font      = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
titleRow.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
titleRow.getCell(1).alignment = { horizontal: "center" };

// ── Helper: añade una sección con título, headers, datos y fila de total ──────
function addSection(titulo, secColor, headerColor, rows) {
  ws.addRow([]);

  const secRow = ws.addRow([titulo]);
  ws.mergeCells(`A${secRow.number}:${LAST_COL}${secRow.number}`);
  secRow.getCell(1).font      = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  secRow.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: secColor } };
  secRow.getCell(1).alignment = { horizontal: "center" };

  const hRow = ws.addRow(HEADERS);
  hRow.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > HEADERS.length) return;
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: headerColor } };
    cell.alignment = { horizontal: "center" };
  });

  rows.forEach(rowData => ws.addRow(rowData));

  const total = rows.reduce((acc, r) => acc + (Number(r[IDX_TOTAL]) || 0), 0);
  const totRow = ws.addRow(
    ["", "", "", "", "", `TOTAL ${titulo.toUpperCase()}`, total, "", "", ""]
  );
  totRow.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > HEADERS.length) return;
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
    cell.alignment = { horizontal: "center" };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  });

  return total;
}

const totalIng = addSection("Ingresos", "FF2E75B6", "FF5B9BD5", INGRESOS);
const totalEgr = addSection("Egresos",  "FF555555", "FF777777", EGRESOS);

// ── Resumen de Liquidez ───────────────────────────────────────────────────────
ws.addRow([]);

const resRow = ws.addRow(["RESUMEN DE LIQUIDEZ"]);
ws.mergeCells(`A${resRow.number}:${LAST_COL}${resRow.number}`);
resRow.getCell(1).font      = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
resRow.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
resRow.getCell(1).alignment = { horizontal: "center" };

const liquidezNeta = totalIng - totalEgr;

[
  ["Total Ingresos", totalIng],
  ["Total Egresos",  totalEgr],
  ["Liquidez Neta",  liquidezNeta],
].forEach(([label, value]) => {
  const r = ws.addRow([label, value, "", "", "", "", "", "", "", ""]);
  r.getCell(1).font = { bold: true };
  r.getCell(2).numFmt = "$#,##0.00";
  if (label === "Liquidez Neta") {
    [1, 2].forEach(c => {
      r.getCell(c).fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: value >= 0 ? "FF92D050" : "FFFF0000" },
      };
    });
  }
});

// ── Estilos generales ─────────────────────────────────────────────────────────
ws.columns = Array.from({ length: HEADERS.length }, () => ({ width: 22 }));

ws.eachRow({ includeEmpty: false }, (row) => {
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    if (col > HEADERS.length) return;
    cell.border = {
      top:    { style: "thin" },
      left:   { style: "thin" },
      bottom: { style: "thin" },
      right:  { style: "thin" },
    };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  });
});

// ── Guardar ───────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUT_PATH);
console.log(`✅  Excel generado en: ${OUT_PATH}`);
console.log(`   Total Ingresos: $${totalIng.toLocaleString()}`);
console.log(`   Total Egresos:  $${totalEgr.toLocaleString()}`);
console.log(`   Liquidez Neta:  $${liquidezNeta.toLocaleString()}`);
