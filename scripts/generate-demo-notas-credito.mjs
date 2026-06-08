/**
 * Genera el Excel demo de Notas de Crédito con la MISMA estructura
 * que exportToExcel() en ListNotasCredito.tsx (24 columnas, colores, totales).
 *
 * Salida: public/demo/notas-credito-demo.xlsx
 *
 * Uso: node scripts/generate-demo-notas-credito.mjs
 */

import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../public/demo/notas-credito-demo.xlsx");

const RFC_PROPIO     = "XEME830615XY9";
const NOMBRE_CLIENTE = "Empresa Demo SA de CV";
const MES            = "mayo de 2026";

// ── 24 headers exactos (mismo orden que ListNotasCredito.tsx) ─────────────────
const HEADERS = [
  "Fecha de emision",         // 1
  "UUID",                     // 2
  "RFC Emisor",               // 3
  "Nombre Emisor",            // 4
  "Régimen Emisor",           // 5
  "RFC Receptor",             // 6
  "Nombre Receptor",          // 7
  "Régimen Receptor",         // 8
  "UUID Factura Relacionada", // 9
  "Subtotal",                 // 10
  "IVA 8%",                   // 11
  "IVA 16%",                  // 12
  "Total Trasladados",        // 13
  "Retención ISR",            // 14
  "Retención IVA",            // 15
  "Total Retenidos",          // 16
  "Descuento",                // 17
  "Total",                    // 18
  "Forma Pago",               // 19
  "Moneda",                   // 20
  "Tipo Cambio",              // 21
  "Tipo Comprobante",         // 22
  "Método Pago",              // 23
  "Estatus",                  // 24
];

// Índices 0-based
const IDX = {
  rfcEmisor:   2,  // col 3
  rfcReceptor: 5,  // col 6
  total:       17, // col 18
};

function colLetter(n) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Helper: array de 24 valores
function row({
  fecha, uuid, rfcEmisor, nombreEmisor,
  regimenEmisor = "601 - General de Ley PM",
  rfcReceptor, nombreReceptor,
  regimenReceptor = "601 - General de Ley PM",
  uuidFactRel,
  subtotal, iva8 = 0, iva16, totalTrasladados,
  retIsr = 0, retIva = 0, totalRetenidos = 0,
  descuento = 0, total,
  formaPago = "99", moneda = "MXN", tipoCambio = 1,
  tipoComprobante = "E", metodoPago = "PUE",
  estatus = "Vigente",
}) {
  return [
    fecha, uuid,
    rfcEmisor, nombreEmisor, regimenEmisor,
    rfcReceptor, nombreReceptor, regimenReceptor,
    uuidFactRel,
    subtotal, iva8, iva16, totalTrasladados,
    retIsr, retIva, totalRetenidos,
    descuento, total,
    formaPago, moneda, tipoCambio,
    tipoComprobante, metodoPago, estatus,
  ];
}

// ── Datos demo ────────────────────────────────────────────────────────────────
// EMITIDAS por XEME (totalEgreso): descuentos/devoluciones que XEME hace a sus clientes
// RECIBIDAS por XEME (totalAjuste): notas de crédito que recibe de sus proveedores

const NOTAS = [
  // ── Emitida 1: XEME devuelve $5,000 a Walmart (devolución parcial) ──
  row({
    fecha: new Date("2026-05-05"),
    uuid:       "M3N4O5P6-7Q8R-9S0T-1U2V-3W4X5Y6Z7A8B",
    rfcEmisor:  RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "WALMEX860714K84", nombreReceptor: "Walmart de México SA de CV",
    uuidFactRel: "B8C9D0E1-8F9A-0B1C-2D3E-4F5A6B7C8D9E",
    subtotal: 4310.34, iva16: 689.66, totalTrasladados: 689.66,
    total: 5000,
    formaPago: "99", metodoPago: "PUE",
  }),

  // ── Emitida 2: XEME aplica descuento de $2,000 a Bimbo ──
  row({
    fecha: new Date("2026-05-18"),
    uuid:       "N4O5P6Q7-8R9S-0T1U-2V3W-4X5Y6Z7A8B9C",
    rfcEmisor:  RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "GBI920606P34", nombreReceptor: "Grupo Bimbo SAB de CV",
    uuidFactRel: "B2C96E3D-1F2A-4B5C-6D7E-8F9A0B1C2D3E",
    subtotal: 1724.14, iva16: 275.86, totalTrasladados: 275.86,
    total: 2000,
    formaPago: "99", metodoPago: "PUE",
  }),

  // ── Emitida 3: XEME aplica nota por error en factura a FEMSA ($1,500) ──
  row({
    fecha: new Date("2026-05-22"),
    uuid:       "O5P6Q7R8-9S0T-1U2V-3W4X-5Y6Z7A8B9C0D",
    rfcEmisor:  RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "FCO010122SA5", nombreReceptor: "FEMSA Comercio SA de CV",
    uuidFactRel: "D4E5F6A7-3B4C-6D7E-8F9A-0B1C2D3E4F5A",
    subtotal: 1293.10, iva16: 206.90, totalTrasladados: 206.90,
    total: 1500,
    formaPago: "99", metodoPago: "PUE",
  }),

  // ── Recibida 1: Amazon emite NC a XEME por error en precio ($1,000) ──
  row({
    fecha: new Date("2026-05-16"),
    uuid:       "P6Q7R8S9-0T1U-2V3W-4X5Y-6Z7A8B9C0D1E",
    rfcEmisor:  "AME170831G61", nombreEmisor: "Amazon México SC",
    rfcReceptor: RFC_PROPIO, nombreReceptor: NOMBRE_CLIENTE,
    uuidFactRel: "D4E5F6A7-4B5C-6D7E-8F9A-0B1C2D3E4F5A",
    subtotal: 862.07, iva16: 137.93, totalTrasladados: 137.93,
    total: 1000,
    formaPago: "99", metodoPago: "PUE",
  }),

  // ── Recibida 2: Renta de Oficinas emite NC a XEME por sobrecobro ($1,500) ──
  row({
    fecha: new Date("2026-05-26"),
    uuid:       "Q7R8S9T0-1U2V-3W4X-5Y6Z-7A8B9C0D1E2F",
    rfcEmisor:  "ROF030512BC4", nombreEmisor: "Renta de Oficinas SA de CV",
    rfcReceptor: RFC_PROPIO, nombreReceptor: NOMBRE_CLIENTE,
    uuidFactRel: "F6A7B8C9-6D7E-8F9A-0B1C-2D3E4F5A6B7C",
    subtotal: 1293.10, iva16: 206.90, totalTrasladados: 206.90,
    total: 1500,
    formaPago: "99", metodoPago: "PUE",
  }),
];

// ── Workbook ──────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "CuentIA";
wb.created = new Date();

const ws = wb.addWorksheet(MES);

// Fila 1: título
const lastCol = colLetter(HEADERS.length); // "X"
ws.mergeCells(`A1:${lastCol}1`);
const titleCell = ws.getCell("A1");
titleCell.value     = `Notas de crédito del mes ${MES} - Cliente ${NOMBRE_CLIENTE}`;
titleCell.font      = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
titleCell.alignment = { horizontal: "center" };
titleCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004080" } };

// Fila 2: headers
const headerRow = ws.addRow(HEADERS);
headerRow.eachCell((cell) => {
  cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F9EA0" } };
});

// Filas de datos
NOTAS.forEach((rowData, i) => {
  const r = ws.addRow(rowData);

  r.getCell(1).numFmt = "dd/mm/yyyy"; // Fecha de emision

  r.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF7F7F7" } };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  });

  r.getCell(1).numFmt = "dd/mm/yyyy"; // re-aplica tras el bucle numérico
});

// ── Totales ───────────────────────────────────────────────────────────────────
// totalEgreso  = notas donde XEME es emisor (descuentos/devoluciones emitidos)
// totalAjuste  = notas donde XEME es receptor (ajustes recibidos de proveedores)
const totalEgreso = NOTAS
  .filter(r => r[IDX.rfcEmisor] === RFC_PROPIO)
  .reduce((acc, r) => acc + (Number(r[IDX.total]) || 0), 0);

const totalAjuste = NOTAS
  .filter(r => r[IDX.rfcReceptor] === RFC_PROPIO)
  .reduce((acc, r) => acc + (Number(r[IDX.total]) || 0), 0);

const totalDiferencia = totalAjuste - totalEgreso;

function addTotalRow(ws, label, value, fontArgb, bgArgb) {
  const r = ws.addRow(Array(HEADERS.length).fill(""));
  r.getCell(17).value = label;  // col "Descuento" → label
  r.getCell(18).value = value;  // col "Total"
  r.eachCell((cell) => {
    cell.font   = { bold: true, color: { argb: fontArgb } };
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  });
}

addTotalRow(ws, "TOTAL DIFERENCIA",        totalDiferencia, "FFFFFFFF", "FF2F4F4F");
addTotalRow(ws, "TOTAL AJUSTE/REDUCCIÓN",  totalAjuste,     "FF006400", "FFDFFFD6");
addTotalRow(ws, "TOTAL EGRESO",            totalEgreso,     "FF8B0000", "FFFFE5E5");

ws.columns.forEach((col) => (col.width = 18));

// ── Guardar ───────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUT_PATH);
console.log(`✅  Excel generado en: ${OUT_PATH}`);
console.log(`   Total Egreso (emitidas):    $${totalEgreso.toLocaleString()}`);
console.log(`   Total Ajuste (recibidas):   $${totalAjuste.toLocaleString()}`);
console.log(`   Diferencia:                 $${totalDiferencia.toLocaleString()}`);
