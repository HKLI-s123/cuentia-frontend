/**
 * Genera el Excel demo de CFDIs Generales con la MISMA estructura
 * que exportToExcel() en ListFacturas.tsx (25 columnas reales, colores, totales).
 *
 * Salida: public/demo/cfdi-emitidos-demo.xlsx
 *
 * Uso: node scripts/generate-demo-excel.mjs
 */

import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../public/demo/cfdi-emitidos-demo.xlsx");

// ── Datos demo ──────────────────────────────────────────────────────────────
const RFC_PROPIO = "XEME830615XY9";
const NOMBRE_CLIENTE = "Empresa Demo SA de CV";
const MES = "mayo 2026";

// 25 columnas exactas (mismo orden que ListFacturas.tsx)
// Fecha | UUID | Cliente/Proveedor/Empleado | RFC Emisor | Regimen Emisor |
// RFC Receptor | Regimen Receptor | SubTotal | IVA 8% | IVA 16% | Total Trasladados |
// Retencion ISR | Retencion IVA | Retencion IEPS | Total Retenidos |
// Descuento | Total | Moneda | Tipo de Cambio | Clasificacion |
// Tipo de Comprobante | Forma Pago | Metodo Pago | Uso CFDI | Estatus

const INGRESOS = [
  ["01/05/26", "5F3A8B2C-4E6F-1A2B-3C4D-5E6F7A8B9C0D", "Walmart de México SA de CV",   "XEME830615XY9", "601 - General de Ley PM",  "WALMEX860714K84", "601 - General de Ley PM",  86206.90, 0, 13793.10, 13793.10, 0, 0, 0, 0, 0, 100000.00, "MXN", 1, "Ingreso", "I", "03", "PUE", "G03", "Vigente"],
  ["05/05/26", "9D1E4F7A-8B2C-3D4E-5F6A-7B8C9D0E1F2A", "Cemex Operaciones SA de CV",   "XEME830615XY9", "601 - General de Ley PM",  "CMX200522J40",    "601 - General de Ley PM",  43103.45, 0,  6896.55,  6896.55, 0, 0, 0, 0, 0,  50000.00, "MXN", 1, "Ingreso", "I", "03", "PUE", "G03", "Vigente"],
  ["08/05/26", "B2C96E3D-1F2A-4B5C-6D7E-8F9A0B1C2D3E", "Grupo Bimbo SAB de CV",        "XEME830615XY9", "601 - General de Ley PM",  "GBI920606P34",    "601 - General de Ley PM",  25862.07, 0,  4137.93,  4137.93, 0, 0, 0, 0, 0,  30000.00, "MXN", 1, "Ingreso", "I", "03", "PPD", "G03", "Vigente"],
  ["12/05/26", "C3D4E5F6-2A3B-5C6D-7E8F-9A0B1C2D3E4F", "Público en General",           "XEME830615XY9", "601 - General de Ley PM",  "XAXX010101000",   "616 - Sin Obligaciones",   12931.03, 0,  2068.97,  2068.97, 0, 0, 0, 0, 0,  15000.00, "MXN", 1, "Ingreso", "I", "01", "PUE", "G01", "Cancelado"],
  ["18/05/26", "D4E5F6A7-3B4C-6D7E-8F9A-0B1C2D3E4F5A", "FEMSA Comercio SA de CV",      "XEME830615XY9", "601 - General de Ley PM",  "FCO010122SA5",    "601 - General de Ley PM",  68965.52, 0, 11034.48, 11034.48, 0, 0, 0, 0, 0,  80000.00, "MXN", 1, "Ingreso", "I", "03", "PPD", "G03", "Vigente"],
  ["22/05/26", "E5F6A7B8-4C5D-7E8F-9A0B-1C2D3E4F5A6B", "Servicios Int SA de CV",       "XEME830615XY9", "601 - General de Ley PM",  "SIN900215AB3",    "601 - General de Ley PM",  43103.45, 0,  6896.55,  6896.55, 2155.17, 1724.14, 0, 3879.31, 0,  50000.00, "MXN", 1, "Ingreso", "I", "03", "PUE", "P01", "Vigente"],
  ["28/05/26", "F6A7B8C9-5D6E-8F9A-0B1C-2D3E4F5A6B7C", "Consultoría MX SA de CV",      "XEME830615XY9", "601 - General de Ley PM",  "CMX200600J99",    "601 - General de Ley PM",  34482.76, 0,  5517.24,  5517.24, 0, 0, 0, 0, 0,  40000.00, "MXN", 1, "Ingreso", "I", "03", "PUE", "G03", "Vigente"],
];

const EGRESOS = [
  ["02/05/26", "A1B2C3D4-1E2F-3A4B-5C6D-7E8F9A0B1C2D", "Telmex SA de CV",              "TME840315KT6",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",   2155.17, 0,  344.83,   344.83, 0, 0, 0, 0, 0,   2500.00, "MXN", 1, "Egreso", "I", "03", "PUE", "G03", "Vigente"],
  ["05/05/26", "B2C3D4E5-2F3A-4B5C-6D7E-8F9A0B1C2D3E", "CFE Suministro Básico",        "CFE370814QI0",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",   5172.41, 0,  827.59,   827.59, 0, 0, 0, 0, 0,   6000.00, "MXN", 1, "Egreso", "I", "03", "PUE", "G03", "Vigente"],
  ["08/05/26", "C3D4E5F6-3A4B-5C6D-7E8F-9A0B1C2D3E4F", "Oxxo Comercial SA",            "OCO820309EN5",  "621 - Incorporación Fiscal", "XEME830615XY9",  "601 - General de Ley PM",   4310.34, 0,  689.66,   689.66, 0, 0, 0, 0, 0,   5000.00, "MXN", 1, "Egreso", "I", "01", "PUE", "G01", "Vigente"],
  ["10/05/26", "D4E5F6A7-4B5C-6D7E-8F9A-0B1C2D3E4F5A", "Amazon México SC",             "AME170831G61",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",  12931.03, 0, 2068.97,  2068.97, 0, 0, 0, 0, 0,  15000.00, "MXN", 1, "Egreso", "I", "03", "PPD", "G03", "Vigente"],
  ["14/05/26", "E5F6A7B8-5C6D-7E8F-9A0B-1C2D3E4F5A6B", "Office Depot México SA",       "ODM961101R48",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",   3448.28, 0,  551.72,   551.72, 0, 0, 0, 0, 0,   4000.00, "MXN", 1, "Egreso", "I", "03", "PUE", "G03", "Vigente"],
  ["15/05/26", "F6A7B8C9-6D7E-8F9A-0B1C-2D3E4F5A6B7C", "Renta de Oficinas SA de CV",  "ROF030512BC4",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",  17241.38, 0, 2758.62,  2758.62, 862.07, 689.66, 0, 1551.73, 0,  20000.00, "MXN", 1, "Egreso", "I", "03", "PUE", "D01", "Vigente"],
  ["20/05/26", "A7B8C9D0-7E8F-9A0B-1C2D-3E4F5A6B7C8D", "Computación Integral SA",     "CIN910801ZB3",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",   8620.69, 0, 1379.31,  1379.31, 0, 0, 0, 0, 0,  10000.00, "MXN", 1, "Egreso", "I", "03", "PPD", "G03", "Vigente"],
  ["25/05/26", "B8C9D0E1-8F9A-0B1C-2D3E-4F5A6B7C8D9E", "Papelería Nacional SA",       "PNA800101XY8",  "621 - Incorporación Fiscal", "XEME830615XY9",  "601 - General de Ley PM",    862.07, 0,  137.93,   137.93, 0, 0, 0, 0, 0,   1000.00, "MXN", 1, "Egreso", "I", "01", "PUE", "G01", "Vigente"],
  ["28/05/26", "C9D0E1F2-9A0B-1C2D-3E4F-5A6B7C8D9E0F", "Claro México SA de CV",       "AMX980101QX3",  "601 - General de Ley PM",  "XEME830615XY9",   "601 - General de Ley PM",   1293.10, 0,  206.90,   206.90, 0, 0, 0, 0, 0,   1500.00, "MXN", 1, "Egreso", "I", "03", "PUE", "G03", "Vigente"],
];

const NOMINA = [
  ["15/05/26", "E1F2A3B4-0B1C-2D3E-4F5A-6B7C8D9E0F1A", "García López Juan Antonio",   "XEME830615XY9", "601 - General de Ley PM",  "GALJ850312AB3",   "605 - Sueldos y Salarios",  13793.10, 0, 0, 0, 2758.62, 0, 0, 2758.62, 0, 11034.48, "MXN", 1, "Nomina", "N", "04", "PUE", "CN01", "Vigente"],
  ["15/05/26", "F2A3B4C5-1C2D-3E4F-5A6B-7C8D9E0F1A2B", "Martínez Ruiz Ana Patricia",  "XEME830615XY9", "601 - General de Ley PM",  "MARA920615XY8",   "605 - Sueldos y Salarios",  10344.83, 0, 0, 0, 1551.72, 0, 0, 1551.72, 0,  8793.11, "MXN", 1, "Nomina", "N", "04", "PUE", "CN01", "Vigente"],
  ["15/05/26", "A3B4C5D6-2D3E-4F5A-6B7C-8D9E0F1A2B3C", "Hernández Pérez José Luis",   "XEME830615XY9", "601 - General de Ley PM",  "HEPJ780901ZW4",   "605 - Sueldos y Salarios",  15086.21, 0, 0, 0, 3017.24, 0, 0, 3017.24, 0, 12068.97, "MXN", 1, "Nomina", "N", "04", "PUE", "CN01", "Vigente"],
  ["15/05/26", "B4C5D6E7-3E4F-5A6B-7C8D-9E0F1A2B3C4D", "Torres Ramírez Luis Enrique",  "XEME830615XY9", "601 - General de Ley PM",  "TORL890623MN7",   "605 - Sueldos y Salarios",   9482.76, 0, 0, 0, 1422.41, 0, 0, 1422.41, 0,  8060.35, "MXN", 1, "Nomina", "N", "04", "PUE", "CN01", "Vigente"],
  ["15/05/26", "C5D6E7F8-4F5A-6B7C-8D9E-0F1A2B3C4D5E", "López Sánchez María del C.",  "XEME830615XY9", "601 - General de Ley PM",  "LOSM951104OP2",   "605 - Sueldos y Salarios",  11206.90, 0, 0, 0, 1681.03, 0, 0, 1681.03, 0,  9525.87, "MXN", 1, "Nomina", "N", "04", "PUE", "CN01", "Vigente"],
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const HEADERS = [
  "Fecha", "UUID", "Nombre", "RFC Emisor", "Regimen Emisor",
  "RFC Receptor", "Regimen Receptor", "SubTotal", "IVA 8%", "IVA 16%",
  "Total Trasladados", "Retencion ISR", "Retencion IVA", "Retencion IEPS",
  "Total Retenidos", "Descuento", "Total", "Moneda", "Tipo de Cambio",
  "Clasificación", "Tipo de Comprobante", "Forma Pago", "Metodo Pago",
  "Uso CFDI", "Estatus",
];
const N_COLS = HEADERS.length; // 25

function applyHeaderStyle(cell, headerArgb) {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerArgb } };
  cell.alignment = { horizontal: "center" };
}

function applyTotalStyle(cell, cols) {
  if (cell.col > cols) return;
  cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
  cell.alignment = { horizontal: "center" };
}

function applyBorders(ws, cols) {
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum > cols) return;
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
      if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
    });
  });
}

const FIN_INDICES = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]; // indices 0-based en cada row (SubTotal…Total)

function sumFinancials(rows) {
  return FIN_INDICES.map(i => rows.reduce((acc, r) => acc + (Number(r[i]) || 0), 0));
}

// ── Main ─────────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "CuentIA";
wb.created = new Date();

// ══ Hoja mensual: "mayo 2026" ═══════════════════════════════════════════════
const ws = wb.addWorksheet(MES);

// Título principal (A1:Y1)
ws.mergeCells(`A1:Y1`);
const tituloCell = ws.getCell("A1");
tituloCell.value = `Reporte de Facturas - ${MES} - Cliente ${NOMBRE_CLIENTE}`;
tituloCell.font = { bold: true, size: 16 };
tituloCell.alignment = { horizontal: "center" };

const SECCIONES = [
  { titulo: "Ingresos", data: INGRESOS,  colorTitulo: "FF2E75B6", colorHeader: "FF5B9BD5", tercero: "Cliente"    },
  { titulo: "Egresos",  data: EGRESOS,   colorTitulo: "FF555555", colorHeader: "FF777777", tercero: "Proveedor"  },
  { titulo: "Nómina",   data: NOMINA,    colorTitulo: "FFA0A0A0", colorHeader: "FFC0C0C0", tercero: "Empleado"   },
];

for (const sec of SECCIONES) {
  // — Título sección
  ws.addRow([]);
  const secRowNum = ws.lastRow.number + 1;
  ws.mergeCells(`A${secRowNum}:Y${secRowNum}`);
  const secCell = ws.getCell(`A${secRowNum}`);
  secCell.value = sec.titulo;
  secCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  secCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sec.colorTitulo } };
  secCell.alignment = { horizontal: "center" };

  // — Headers (ajustar label de columna 3 = tercero)
  const headers = [...HEADERS];
  headers[2] = sec.tercero;
  const hRow = ws.addRow(headers);
  hRow.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= N_COLS) applyHeaderStyle(cell, sec.colorHeader);
  });

  // — Datos
  // Para Egresos: agrupados por RFC emisor (igual que la plataforma)
  if (sec.titulo === "Egresos") {
    const grupos = {};
    sec.data.forEach(r => {
      const rfc = r[3];
      if (!grupos[rfc]) grupos[rfc] = [];
      grupos[rfc].push(r);
    });
    for (const [rfc, rows] of Object.entries(grupos)) {
      rows.forEach(r => {
        const row = ws.addRow(r);
        if (r[21] === "01") { // forma pago 01 = efectivo → verde claro
          row.eachCell(cell => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCFFCC" } };
          });
        }
      });
      // Total por RFC
      const tots = sumFinancials(rows);
      ws.addRow(["", "", "", `TOTAL ${rfc}`, "", "", "", ...tots, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
      ws.lastRow.font = { bold: true };
    }
  } else {
    sec.data.forEach(r => {
      const row = ws.addRow(r);
      if (r[21] === "01") {
        row.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCFFCC" } };
        });
      }
    });
  }

  ws.addRow([]);

  // — Total sección
  const tots = sumFinancials(sec.data);
  const totLabel = `TOTAL ${sec.titulo.toUpperCase()}`;
  const totRow = ws.addRow(["", "", "", totLabel, "", "", "", ...tots, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
  totRow.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= N_COLS) applyTotalStyle(cell, N_COLS);
  });

  ws.addRow([]);
}

ws.columns = Array(N_COLS).fill({ width: 22 });
applyBorders(ws, N_COLS);

// ══ Hoja "Totales" ════════════════════════════════════════════════════════════
const wsTotales = wb.addWorksheet("Totales");

wsTotales.mergeCells("A1:M1");
const tituloTot = wsTotales.getCell("A1");
tituloTot.value = "Resumen de Totales por Mes";
tituloTot.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
tituloTot.alignment = { horizontal: "center" };
tituloTot.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };

const headersTot = [
  "Mes",
  "SubTotal (Egr)", "IVA 8% (Egr)", "IVA 16% (Egr)", "Total Trasladados (Egr)",
  "Retención ISR (Egr)", "Retención IVA (Egr)", "Retención IEPS (Egr)", "Total Retenidos (Egr)",
  "Descuento (Egr)", "Total Egresos", "Total Ingresos", "Total General",
];
const hRowTot = wsTotales.addRow(headersTot);
hRowTot.eachCell({ includeEmpty: true }, (cell, col) => {
  if (col <= 13) applyHeaderStyle(cell, "FF2E75B6");
});

const sumField = (rows, idx) => rows.reduce((acc, r) => acc + (Number(r[idx]) || 0), 0);
const totalEgr = sumField(EGRESOS, 16);
const totalIng = sumField(INGRESOS, 16);

wsTotales.addRow([
  MES,
  sumField(EGRESOS, 7),  sumField(EGRESOS, 8),  sumField(EGRESOS, 9),  sumField(EGRESOS, 10),
  sumField(EGRESOS, 11), sumField(EGRESOS, 12), sumField(EGRESOS, 13), sumField(EGRESOS, 14),
  sumField(EGRESOS, 15), totalEgr, totalIng, totalIng - totalEgr,
]);

const totGlobal = wsTotales.addRow([
  "TOTAL GLOBAL",
  sumField(EGRESOS, 7),  sumField(EGRESOS, 8),  sumField(EGRESOS, 9),  sumField(EGRESOS, 10),
  sumField(EGRESOS, 11), sumField(EGRESOS, 12), sumField(EGRESOS, 13), sumField(EGRESOS, 14),
  sumField(EGRESOS, 15), totalEgr, totalIng, totalIng - totalEgr,
]);
totGlobal.eachCell({ includeEmpty: true }, (cell, col) => {
  if (col <= 13) applyTotalStyle(cell, 13);
});

wsTotales.columns = Array(13).fill({ width: 22 });
applyBorders(wsTotales, 13);

// ══ Hoja "Retenidos" ══════════════════════════════════════════════════════════
const wsRet = wb.addWorksheet("Retenidos");

wsRet.mergeCells("A1:H1");
const tituloRet = wsRet.getCell("A1");
tituloRet.value = "Retenciones general";
tituloRet.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
tituloRet.alignment = { horizontal: "center", vertical: "middle" };
tituloRet.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B0082" } };

const hRowRet = wsRet.addRow(["Mes", "Cliente", "RFC Emisor", "RFC Receptor", "Fecha", "Total", "Total Retenidos", "Estatus"]);
hRowRet.eachCell({ includeEmpty: true }, (cell, col) => {
  if (col <= 8) applyHeaderStyle(cell, "FF6A5ACD");
});

const facturasConRetencion = [...INGRESOS, ...EGRESOS].filter(r => Number(r[14]) > 0);

const subMes = wsRet.addRow([MES]);
subMes.font = { bold: true };
wsRet.mergeCells(`A${subMes.number}:H${subMes.number}`);

facturasConRetencion.forEach(r => {
  const cliente = r[2]; // nombre
  wsRet.addRow([MES, cliente, r[3], r[5], r[0], r[16], r[14], r[24]]);
});

const totalRetMes = facturasConRetencion.reduce((acc, r) => acc + (Number(r[14]) || 0), 0);
const totRetRow = wsRet.addRow(["", "", "", "", "TOTAL RETENIDO DEL MES", "", totalRetMes, ""]);
totRetRow.eachCell({ includeEmpty: true }, (cell, col) => {
  if (col <= 8) {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
    cell.border = {
      top: { style: "medium" }, left: { style: "thin" },
      bottom: { style: "medium" }, right: { style: "thin" },
    };
    if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
  }
});

wsRet.columns = Array(8).fill({ width: 24 });
applyBorders(wsRet, 8);

// ── Guardar ───────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUT_PATH);
console.log(`✅  Excel generado en: ${OUT_PATH}`);
