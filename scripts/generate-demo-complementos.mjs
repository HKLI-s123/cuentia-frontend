/**
 * Genera el Excel demo de Complementos de Pago con la MISMA estructura
 * que exportToExcel() en ListComplementos.tsx (51 columnas, colores, totales).
 *
 * Salida: public/demo/complementos-pago-demo.xlsx
 *
 * Uso: node scripts/generate-demo-complementos.mjs
 */

import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../public/demo/complementos-pago-demo.xlsx");

const RFC_PROPIO     = "XEME830615XY9";
const NOMBRE_CLIENTE = "Empresa Demo SA de CV";
const MES            = "mayo de 2026";

// ── 51 headers (Serie y Condiciones Pago removidos) ───────────────────────────
const HEADERS = [
  "Fecha Emisión",       "UUID Complemento",        "UUID Factura",        // 1-3
  "RFC Emisor",          "Nombre Emisor",            "Régimen Emisor",      // 4-6
  "RFC Receptor",        "Nombre Receptor",          "Régimen Receptor",    // 7-9
  "Fecha Pago",          "Forma Pago",                                      // 10-11
  "Moneda Pago",         "Tipo Cambio Pago",         "Monto",               // 12-14
  "RFC Emisor Cta Ord",  "Banco Ordenante",          "Cta Ordenante",       // 15-17
  "RFC Emisor Cta Ben",  "Cta Beneficiario",                                // 18-19
  "Folio",               "Moneda DR",                "Equivalencia DR",     // 20-22
  "Num Parcialidad",     "Imp Saldo Ant",            "Imp Pagado",          // 23-25
  "Imp Saldo Insoluto",  "Objeto Imp DR",            "Metodo Pago DR",      // 26-28
  "Fecha Factura",       "Forma Pago Factura",                              // 29-30
  "Subtotal",            "Descuento",                "Moneda",              // 31-33
  "Tipo Cambio",         "Total",                                           // 34-35
  "Tipo Comprobante",    "Metodo Pago",                                     // 36-37
  "Total Imp Trasladados", "Total Imp Retenidos",                           // 38-39
  "Base 16%",            "Importe Trasladado 16%",   "Tipo Factor 16",      // 40-42
  "Tasa Cuota 16",       "Impuesto Retenido",                               // 43-44
  "Base 8%",             "Importe Trasladado 8%",    "Tipo Factor 8",       // 45-47
  "Tasa Cuota 8",        "Base Exento",                                     // 48-49
  "Impuesto Exento",     "Tipo Exento",                                     // 50-51
];

// Índices 0-based en el array de datos
const IDX = {
  rfcEmisor:   3,   // col 4
  rfcReceptor: 6,   // col 7
  total:       34,  // col 35
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

// Helper: construye array de 51 valores con defaults
function row({
  fechaEmision, uuidCompl, uuidFact,
  rfcEmisor, nombreEmisor, regimenEmisor = "601 - General de Ley PM",
  rfcReceptor, nombreReceptor, regimenReceptor = "601 - General de Ley PM",
  fechaPago, formaPago,
  monedaPago = "MXN", tcPago = 1, monto,
  rfcCuentaOrd = "", bancoOrd = "", ctaOrd = "",
  rfcCuentaBen = "", ctaBen = "",
  folio = "",
  monedaDR = "MXN", equivalenciaDR = 1,
  numParc, impSaldoAnt, impPagado, impSaldoInsoluto,
  objetoImpDR = "02", metodoPagoDR = "PPD",
  fechaFactura, formaPagoFactura = "99",
  subtotal, descuento = 0,
  moneda = "MXN", tipoCambio = 1, total,
  tipoComprobante = "P", metodoPago = "PPD",
  totalImpTras = 0, totalImpRet = 0,
  base16 = 0, impTras16 = 0, tipoFactor16 = "", tasaCuota16 = 0,
  impRetenido = 0,
  base8 = 0, impTras8 = 0, tipoFactor8 = "Tasa", tasaCuota8 = 0,
  baseExento = 0, impExento = 0, tipoExento = 0,
}) {
  return [
    fechaEmision, uuidCompl, uuidFact,
    rfcEmisor, nombreEmisor, regimenEmisor,
    rfcReceptor, nombreReceptor, regimenReceptor,
    fechaPago, formaPago,
    monedaPago, tcPago, monto,
    rfcCuentaOrd, bancoOrd, ctaOrd,
    rfcCuentaBen, ctaBen,
    folio, monedaDR, equivalenciaDR,
    numParc, impSaldoAnt, impPagado, impSaldoInsoluto,
    objetoImpDR, metodoPagoDR,
    fechaFactura, formaPagoFactura,
    subtotal, descuento, moneda, tipoCambio, total,
    tipoComprobante, metodoPago,
    totalImpTras, totalImpRet,
    base16, impTras16, tipoFactor16, tasaCuota16, impRetenido,
    base8, impTras8, tipoFactor8, tasaCuota8,
    baseExento, impExento, tipoExento,
  ];
}

// ── Datos demo ────────────────────────────────────────────────────────────────
const PAGOS = [
  // ── Ingreso 1/2: Walmart paga $50,000 de factura $100,000 ──
  row({
    fechaEmision: new Date("2026-05-12"),
    uuidCompl: "A1B2C3D4-1E2F-3A4B-5C6D-7E8F9A0B1C2D",
    uuidFact:  "B8C9D0E1-8F9A-0B1C-2D3E-4F5A6B7C8D9E",
    rfcEmisor: RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "WALMEX860714K84", nombreReceptor: "Walmart de México SA de CV",
    fechaPago: new Date("2026-05-12"), formaPago: "03 - Transferencia electrónica",
    monto: 50000,
    rfcCuentaOrd: RFC_PROPIO, bancoOrd: "BANAMEX", ctaOrd: "0123456789",
    rfcCuentaBen: "WALMEX860714K84", ctaBen: "9876543210", folio: "1",
    numParc: 1, impSaldoAnt: 100000, impPagado: 50000, impSaldoInsoluto: 50000,
    fechaFactura: new Date("2026-05-08"),
    subtotal: 43103.45, total: 50000,
    totalImpTras: 6896.55, base16: 43103.45, impTras16: 6896.55,
    tipoFactor16: "Tasa", tasaCuota16: 0.16,
  }),

  // ── Ingreso 2/2: Walmart paga $50,000 restantes ──
  row({
    fechaEmision: new Date("2026-05-25"),
    uuidCompl: "B2C3D4E5-2F3A-4B5C-6D7E-8F9A0B1C2D3E",
    uuidFact:  "B8C9D0E1-8F9A-0B1C-2D3E-4F5A6B7C8D9E",
    rfcEmisor: RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "WALMEX860714K84", nombreReceptor: "Walmart de México SA de CV",
    fechaPago: new Date("2026-05-25"), formaPago: "03 - Transferencia electrónica",
    monto: 50000,
    rfcCuentaOrd: RFC_PROPIO, bancoOrd: "BANAMEX", ctaOrd: "0123456789",
    rfcCuentaBen: "WALMEX860714K84", ctaBen: "9876543210", folio: "1",
    numParc: 2, impSaldoAnt: 50000, impPagado: 50000, impSaldoInsoluto: 0,
    fechaFactura: new Date("2026-05-08"),
    subtotal: 43103.45, total: 50000,
    totalImpTras: 6896.55, base16: 43103.45, impTras16: 6896.55,
    tipoFactor16: "Tasa", tasaCuota16: 0.16,
  }),

  // ── Ingreso 1/1: FEMSA paga $80,000 de una sola vez ──
  row({
    fechaEmision: new Date("2026-05-18"),
    uuidCompl: "C3D4E5F6-3A4B-5C6D-7E8F-9A0B1C2D3E4F",
    uuidFact:  "D4E5F6A7-3B4C-6D7E-8F9A-0B1C2D3E4F5A",
    rfcEmisor: RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "FCO010122SA5", nombreReceptor: "FEMSA Comercio SA de CV",
    fechaPago: new Date("2026-05-18"), formaPago: "03 - Transferencia electrónica",
    monto: 80000,
    rfcCuentaOrd: RFC_PROPIO, bancoOrd: "BBVA", ctaOrd: "1234567890",
    rfcCuentaBen: "FCO010122SA5", ctaBen: "0987654321", folio: "1",
    numParc: 1, impSaldoAnt: 80000, impPagado: 80000, impSaldoInsoluto: 0,
    fechaFactura: new Date("2026-05-18"),
    subtotal: 68965.52, total: 80000,
    totalImpTras: 11034.48, base16: 68965.52, impTras16: 11034.48,
    tipoFactor16: "Tasa", tasaCuota16: 0.16,
  }),

  // ── Ingreso 1/2: Bimbo paga $15,000 de factura $30,000 ──
  row({
    fechaEmision: new Date("2026-05-20"),
    uuidCompl: "D4E5F6A7-4B5C-6D7E-8F9A-0B1C2D3E4F5A",
    uuidFact:  "B2C96E3D-1F2A-4B5C-6D7E-8F9A0B1C2D3E",
    rfcEmisor: RFC_PROPIO, nombreEmisor: NOMBRE_CLIENTE,
    rfcReceptor: "GBI920606P34", nombreReceptor: "Grupo Bimbo SAB de CV",
    fechaPago: new Date("2026-05-20"), formaPago: "02 - Cheque nominativo",
    monto: 15000,
    rfcCuentaOrd: RFC_PROPIO, bancoOrd: "SANTANDER", ctaOrd: "5555444433",
    rfcCuentaBen: "GBI920606P34", ctaBen: "3333222211", folio: "2",
    numParc: 1, impSaldoAnt: 30000, impPagado: 15000, impSaldoInsoluto: 15000,
    fechaFactura: new Date("2026-05-08"),
    subtotal: 12931.03, total: 15000,
    totalImpTras: 2068.97, base16: 12931.03, impTras16: 2068.97,
    tipoFactor16: "Tasa", tasaCuota16: 0.16,
  }),

  // ── Egreso 1/1: XEME paga $15,000 a Amazon, Amazon emite complemento ──
  row({
    fechaEmision: new Date("2026-05-14"),
    uuidCompl: "E5F6A7B8-5C6D-7E8F-9A0B-1C2D3E4F5A6B",
    uuidFact:  "D4E5F6A7-4B5C-6D7E-8F9A-0B1C2D3E4F5A",
    rfcEmisor: "AME170831G61", nombreEmisor: "Amazon México SC",
    rfcReceptor: RFC_PROPIO, nombreReceptor: NOMBRE_CLIENTE,
    fechaPago: new Date("2026-05-14"), formaPago: "03 - Transferencia electrónica",
    monto: 15000,
    rfcCuentaOrd: "AME170831G61", bancoOrd: "HSBC", ctaOrd: "6666555544",
    rfcCuentaBen: RFC_PROPIO, ctaBen: "4444333322", folio: "1",
    numParc: 1, impSaldoAnt: 15000, impPagado: 15000, impSaldoInsoluto: 0,
    fechaFactura: new Date("2026-05-10"),
    subtotal: 12931.03, total: 15000,
    totalImpTras: 2068.97, base16: 12931.03, impTras16: 2068.97,
    tipoFactor16: "Tasa", tasaCuota16: 0.16,
  }),

  // ── Egreso 1/2: XEME paga $5,000 de $10,000 a Computación Integral ──
  row({
    fechaEmision: new Date("2026-05-22"),
    uuidCompl: "F6A7B8C9-6D7E-8F9A-0B1C-2D3E4F5A6B7C",
    uuidFact:  "A7B8C9D0-7E8F-9A0B-1C2D-3E4F5A6B7C8D",
    rfcEmisor: "CIN910801ZB3", nombreEmisor: "Computación Integral SA",
    rfcReceptor: RFC_PROPIO, nombreReceptor: NOMBRE_CLIENTE,
    fechaPago: new Date("2026-05-22"), formaPago: "03 - Transferencia electrónica",
    monto: 5000,
    rfcCuentaOrd: "CIN910801ZB3", bancoOrd: "SCOTIABANK", ctaOrd: "7777666655",
    rfcCuentaBen: RFC_PROPIO, ctaBen: "5555444433", folio: "1",
    numParc: 1, impSaldoAnt: 10000, impPagado: 5000, impSaldoInsoluto: 5000,
    fechaFactura: new Date("2026-05-20"),
    subtotal: 4310.34, total: 5000,
    totalImpTras: 689.66, base16: 4310.34, impTras16: 689.66,
    tipoFactor16: "Tasa", tasaCuota16: 0.16,
  }),
];

// ── Workbook ──────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "CuentIA";
wb.created = new Date();

const ws = wb.addWorksheet(MES);

// Fila 1: título
const lastCol = colLetter(HEADERS.length); // "AY" (51 cols)
ws.mergeCells(`A1:${lastCol}1`);
const titleCell = ws.getCell("A1");
titleCell.value     = `Pagos del mes de ${MES} - Cliente ${NOMBRE_CLIENTE}`;
titleCell.font      = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
titleCell.alignment = { horizontal: "center" };
titleCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004080" } };

// Fila 2: headers
const headerRow = ws.addRow(HEADERS);
headerRow.eachCell((cell) => {
  cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F9EA0" } };
  cell.border    = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
});

// Ordenar por UUID factura (igual que en la plataforma)
const sortedPagos = [...PAGOS].sort((a, b) => String(a[2] || "").localeCompare(String(b[2] || "")));

// Filas de datos
sortedPagos.forEach((rowData, i) => {
  const r = ws.addRow(rowData);

  r.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF7F7F7" } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  });

  // Formato fecha (sobreescribe numFmt numérico aplicado arriba)
  r.getCell(1).numFmt  = "dd/mm/yyyy"; // Fecha Emisión
  r.getCell(10).numFmt = "dd/mm/yyyy"; // Fecha Pago
  r.getCell(29).numFmt = "dd/mm/yyyy"; // Fecha Factura (col 29 tras quitar Serie y CondPago)
});

// ── Totales ───────────────────────────────────────────────────────────────────
const totalIngresos = PAGOS
  .filter(r => r[IDX.rfcEmisor]   === RFC_PROPIO)
  .reduce((acc, r) => acc + (Number(r[IDX.total]) || 0), 0);

const totalEgresos = PAGOS
  .filter(r => r[IDX.rfcReceptor] === RFC_PROPIO)
  .reduce((acc, r) => acc + (Number(r[IDX.total]) || 0), 0);

const totalUtilidad = totalIngresos - totalEgresos;

function addTotalRow(ws, label, value, fontArgb, bgArgb) {
  const r = ws.addRow(Array(HEADERS.length).fill(""));
  r.getCell(34).value = label;  // col "Tipo Cambio" → label
  r.getCell(35).value = value;  // col "Total"
  r.eachCell((cell) => {
    cell.font   = { bold: true, color: { argb: fontArgb } };
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  });
}

addTotalRow(ws, "TOTAL UTILIDAD MES",       totalUtilidad, "FFFFFFFF", "FF2F4F4F");
addTotalRow(ws, "TOTAL INGRESOS POR PAGOS", totalIngresos, "FF006400", "FFDFFFD6");
addTotalRow(ws, "TOTAL EGRESOS POR PAGOS",  totalEgresos,  "FF8B0000", "FFFFE5E5");

// Ancho de columnas
ws.columns.forEach((col) => (col.width = 18));

// ── Guardar ───────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUT_PATH);
console.log(`✅  Excel generado en: ${OUT_PATH}`);
