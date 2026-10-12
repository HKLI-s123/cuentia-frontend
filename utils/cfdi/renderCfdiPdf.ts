// Representación impresa de un CFDI con el mismo layout que el PDF que genera
// el SAT (Consulta / Verificación de CFDI): página 648×792 pt, Helvetica,
// encabezado RFC emisor / Folio fiscal en cada página, tablas de conceptos con
// encabezado gris, totales, sellos, cadena original y QR de verificación.
// Las posiciones salen de medir un PDF original del SAT.

import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { CfdiConceptoPdf, CfdiPdfData, CfdiSeccionPdf, CfdiTablaPdf } from "./types";
import * as cat from "./catalogos";
import { fmtImporte, fmtMoney, fmtTasa, str } from "./format";

const PAGE_W = 648;
const PAGE_H = 792;
const X0 = 28.9; // borde izquierdo de tablas
const TABLE_W = 590.4;
const LABEL_X = 35.8;
const BOTTOM = 738; // límite de contenido (el pie va en 751.8)
const CONT_TOP = 58; // inicio de contenido en páginas 2+

const GRAY: [number, number, number] = [191, 191, 191];

// Columnas de la tabla de conceptos (anchos medidos del PDF del SAT)
const CONCEPTO_COLS = [
  { header: "Clave del producto y/o servicio", width: 57.6 },
  { header: "No. identificación", width: 57.6 },
  { header: "Cantidad", width: 57.6 },
  { header: "Clave de unidad", width: 57.6 },
  { header: "Unidad", width: 57.6 },
  { header: "Valor unitario", width: 64.8 },
  { header: "Importe", width: 79.2 },
  { header: "Descuento", width: 79.2 },
  { header: "Objeto impuesto", width: 79.2 },
];

// Sub-tabla de impuestos del concepto (centros de columna medidos)
const IMP_HEADERS: { lines: string[]; x: number; vx: number }[] = [
  { lines: ["Impuesto"], x: 338.4, vx: 338.4 },
  { lines: ["Tipo"], x: 378.0, vx: 378.0 },
  { lines: ["Base"], x: 435.6, vx: 435.6 },
  { lines: ["Tipo", "Factor"], x: 489.5, vx: 489.5 },
  { lines: ["Tasa o", "Cuota"], x: 518.4, vx: 518.4 },
  { lines: ["Importe"], x: 590.4, vx: 587.5 },
];

/**
 * URL del QR de verificación, idéntica a la del PDF del SAT:
 * https://verificacfdi.facturaelectronica.sat.gob.mx/?id=UUID&re=RFC&rr=RFC&tt=1416.36&fe=yWae4w==
 * tt: total sin ceros no significativos; fe: últimos 8 caracteres del sello del emisor.
 * Al escanearlo abre la consulta de validez del CFDI en el portal del SAT.
 */
export const urlVerificacionSat = (data: CfdiPdfData) => {
  const n = parseFloat(data.total);
  const tt = Number.isFinite(n) ? n.toFixed(6).replace(/\.?0+$/, "") || "0" : "0";
  // "&" es válido en un RFC pero rompería los parámetros de la URL
  const rfc = (v: string) => v.replace(/&/g, "%26");
  return (
    "https://verificacfdi.facturaelectronica.sat.gob.mx/" +
    `?id=${data.timbre?.uuid ?? data.uuid}` +
    `&re=${rfc(data.emisor.rfc)}` +
    `&rr=${rfc(data.receptor.rfc)}` +
    `&tt=${tt}` +
    `&fe=${(data.sello ?? "").slice(-8)}`
  );
};

export async function renderCfdiPdf(data: CfdiPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    unit: "pt",
    format: [PAGE_W, PAGE_H],
    orientation: "portrait",
    compress: true,
  });
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  const font = (style: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const split = (text: string, width: number): string[] => {
    const t = str(text);
    if (!t) return [""];
    return doc.splitTextToSize(t, width) as string[];
  };

  // Partir cadenas largas sin espacios (sellos, cadena original) por carácter
  const wrapChars = (text: string, width: number): string[] => {
    const lines: string[] = [];
    let line = "";
    let w = 0;
    for (const ch of text) {
      const cw = doc.getTextWidth(ch);
      if (w + cw > width && line) {
        lines.push(line);
        line = "";
        w = 0;
      }
      line += ch;
      w += cw;
    }
    if (line) lines.push(line);
    return lines;
  };

  let y = 0; // tope del espacio libre en la página actual

  const newPage = () => {
    doc.addPage([PAGE_W, PAGE_H], "portrait");
    y = CONT_TOP;
  };

  const ensure = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };

  // ───── Bloques etiqueta / valor (encabezado y campos de complementos) ─────

  type Row = { label: string; value: string };

  /** Dibuja filas etiqueta/valor y devuelve la línea base de la última línea. */
  const labelValueRows = (
    rows: Row[],
    labelX: number,
    labelW: number,
    valueX: number,
    valueW: number,
    baseline: number
  ) => {
    let last = baseline - 12.8;
    let b = baseline;
    for (const r of rows) {
      font("bold", 8);
      const labelLines = split(r.label, labelW);
      font("normal", 8);
      const valueLines = split(r.value, valueW);
      font("bold", 8);
      labelLines.forEach((l, i) => doc.text(l, labelX, b + i * 10.5));
      font("normal", 8);
      valueLines.forEach((l, i) => doc.text(l, valueX, b + i * 10.5));
      last = b + (Math.max(labelLines.length, valueLines.length) - 1) * 10.5;
      b = last + 12.8;
    }
    return last;
  };

  // ───── Encabezado (página 1) ─────
  // "RFC emisor" y "Folio fiscal" son encabezado de página: se dibujan al final
  // en todas las páginas (como en el PDF del SAT).

  const r = data.receptor;
  const leftRows: Row[] = [
    { label: "Nombre emisor:", value: data.emisor.nombre },
    { label: "RFC receptor:", value: r.rfc },
    { label: "Nombre receptor:", value: r.nombre },
    { label: "Código postal del receptor:", value: str(r.cp) },
    { label: "Régimen fiscal receptor:", value: cat.regimenFiscal(r.regimen) },
    { label: "Residencia fiscal:", value: str(r.residenciaFiscal) },
    { label: "Número de registro de identidad tributaria:", value: str(r.numRegIdTrib) },
    { label: "Uso CFDI:", value: cat.usoCfdi(r.usoCfdi) },
  ].filter((row, i) => i < 3 || row.value);

  const rightRows: Row[] = [
    { label: "No. de serie del CSD:", value: str(data.noCertificado) },
    {
      label: "Código postal, fecha y hora de emisión:",
      value: [str(data.lugarExpedicion), str(data.fecha)].filter(Boolean).join(" "),
    },
    { label: "Efecto de comprobante:", value: cat.tipoComprobante(data.tipoComprobante) },
    { label: "Régimen fiscal:", value: cat.regimenFiscal(data.emisor.regimen) },
    { label: "Exportación:", value: cat.exportacion(data.exportacion) },
    { label: "Serie:", value: str(data.serie) },
    { label: "Folio:", value: str(data.folio) },
  ].filter((row) => row.value);

  const leftLast = labelValueRows(leftRows, LABEL_X, 80, 122.2, 172, 58.7);
  const rightLast = labelValueRows(rightRows, 302.2, 140, 453.4, 166, 58.7);
  y = Math.max(leftLast, rightLast) + 2;

  // ───── Títulos de sección y tablas genéricas ─────

  const sectionTitle = (titulo: string) => {
    ensure(17 + 16.1 + 30);
    const base = y + 17;
    font("bold", 10);
    doc.text(titulo, LABEL_X, base);
    y = base + 16.1;
  };

  const cellBox = (x: number, top: number, w: number, h: number, gray: boolean) => {
    if (gray) {
      doc.setFillColor(...GRAY);
      doc.rect(x, top, w, h, "FD");
    } else {
      doc.rect(x, top, w, h, "S");
    }
  };

  /** Texto centrado verticalmente en una celda (líneas ya partidas). */
  const cellText = (
    lines: string[],
    x: number,
    w: number,
    top: number,
    h: number,
    lineH: number,
    align: "left" | "center" | "right" = "center",
    capOffset = 2.1
  ) => {
    const first = top + (h - (lines.length - 1) * lineH) / 2 + capOffset;
    lines.forEach((l, i) => {
      const by = first + i * lineH;
      if (align === "center") doc.text(l, x + w / 2, by, { align: "center" });
      else if (align === "right") doc.text(l, x + w - 2, by, { align: "right" });
      else doc.text(l, x + 2, by);
    });
  };

  const tableHeaderRow = (cols: { header: string; width: number }[], minH: number) => {
    font("bold", 6);
    const lines = cols.map((c) => split(c.header, c.width - 2));
    const h = Math.max(minH, Math.max(...lines.map((l) => l.length)) * 7.9 + 4);
    let x = X0;
    cols.forEach((c, i) => {
      cellBox(x, y, c.width, h, true);
      cellText(lines[i], x, c.width, y, h, 7.9, "center", 2.2);
      x += c.width;
    });
    y += h;
  };

  const drawTabla = (tabla: CfdiTablaPdf) => {
    const total = tabla.columnas.reduce((a, c) => a + c.width, 0);
    const cols = tabla.columnas.map((c) => ({ ...c, width: (c.width / total) * TABLE_W }));

    if (tabla.titulo) {
      ensure(12 + 20 + 9);
      font("bold", 8);
      doc.text(tabla.titulo, LABEL_X, y + 10);
      y += 14;
    } else {
      ensure(20 + 9);
    }
    tableHeaderRow(cols, 12);

    for (const fila of tabla.filas) {
      font("normal", 6);
      const lines = cols.map((c, i) => split(fila[i] ?? "", c.width - 3));
      const h = Math.max(9, Math.max(...lines.map((l) => l.length)) * 7 + 2.5);
      if (y + h > BOTTOM) {
        newPage();
        tableHeaderRow(cols, 12);
        font("normal", 6);
      }
      let x = X0;
      cols.forEach((c, i) => {
        cellBox(x, y, c.width, h, false);
        cellText(lines[i], x, c.width, y, h, 7, c.align ?? "center", 2.1);
        x += c.width;
      });
      y += h;
    }
    y += 6;
  };

  const drawSeccion = (sec: CfdiSeccionPdf) => {
    sectionTitle(sec.titulo);
    const campos = sec.campos ?? [];
    if (campos.length > 0) {
      // Campos en dos columnas (se llena primero la izquierda), como el encabezado
      const mitad = Math.ceil(campos.length / 2);
      const left = campos.slice(0, mitad);
      const right = campos.slice(mitad);
      ensure(left.length * 13 + 6);
      const start = y + 2;
      const l = labelValueRows(left, LABEL_X, 135, 175, 120, start);
      const rr = labelValueRows(right, 302.2, 140, 453.4, 166, start);
      y = Math.max(l, rr) + 8;
    }
    for (const t of sec.tablas ?? []) drawTabla(t);
  };

  // ───── Secciones previas a conceptos ─────

  if (data.informacionGlobal) {
    const g = data.informacionGlobal;
    sectionTitle("Información global");
    drawTabla({
      columnas: [
        { header: "Periodicidad", width: 1 },
        { header: "Meses", width: 1 },
        { header: "Año", width: 1 },
      ],
      filas: [[cat.periodicidad(g.periodicidad), cat.mes(g.meses), g.anio]],
    });
  }

  if (data.relacionados.length > 0) {
    sectionTitle("CFDI relacionados");
    drawTabla({
      columnas: [
        { header: "Tipo de relación", width: 1.6 },
        { header: "CFDI relacionado", width: 1 },
      ],
      filas: data.relacionados.map((rel) => [
        `${rel.tipoRelacion} - ${cat.tipoRelacion(rel.tipoRelacion)}`,
        rel.uuid,
      ]),
    });
  }

  // ───── Conceptos ─────

  const drawConcepto = (c: CfdiConceptoPdf) => {
    // Medidas previas para saber si el bloque cabe en la página
    font("bold", 6);
    const headerLines = CONCEPTO_COLS.map((col) => split(col.header, col.width - 2));
    const headerH = Math.max(20.1, Math.max(...headerLines.map((l) => l.length)) * 7.9 + 4);

    const values = [
      c.claveProdServ,
      c.noIdentificacion,
      c.cantidad,
      c.claveUnidad,
      c.unidad,
      c.valorUnitario,
      fmtImporte(c.importe),
      c.descuento || "0",
      cat.objetoImp(c.objetoImp),
    ];
    font("normal", 5.5);
    const valueLines = CONCEPTO_COLS.map((col, i) => split(values[i], col.width - 3));
    const dataH = Math.max(7.5, Math.max(...valueLines.map((l) => l.length)) * 6.3 + 1.5);

    font("normal", 6);
    const descLines = split(c.descripcion, 316.9 - 86.5 - 4);
    const taxBlockH = c.impuestos.length > 0 ? 19.6 + c.impuestos.length * 8.1 : 0;
    const descH = Math.max(27.7, descLines.length * 7.2 + 8, taxBlockH);

    font("normal", 5.5);
    const pedLines = split(c.numeroPedimento, 115.2 - 3);
    const predLines = split(c.cuentaPredial, 115.2 - 3);
    const pedValH = Math.max(8.3, Math.max(pedLines.length, predLines.length) * 6.3 + 2);

    const blockH = headerH + dataH + descH + 8.2 + pedValH;
    ensure(blockH);

    // Encabezado gris
    let x = X0;
    CONCEPTO_COLS.forEach((col, i) => {
      cellBox(x, y, col.width, headerH, true);
      font("bold", 6);
      cellText(headerLines[i], x, col.width, y, headerH, 7.9, "center", 2.2);
      x += col.width;
    });
    y += headerH;

    // Valores
    x = X0;
    font("normal", 5.5);
    CONCEPTO_COLS.forEach((col, i) => {
      cellBox(x, y, col.width, dataH, false);
      cellText(valueLines[i], x, col.width, y, dataH, 6.3, "center", 2.05);
      x += col.width;
    });
    y += dataH;

    // Descripción + impuestos del concepto
    const descTop = y;
    cellBox(X0, descTop, 57.6, descH, true);
    font("bold", 6);
    cellText(["Descripción"], X0, 57.6, descTop, descH, 7.2, "center", 2.2);
    cellBox(86.5, descTop, 316.9 - 86.5, descH, false);
    font("normal", 6);
    const descFirst = descTop + (descH - (descLines.length - 1) * 7.2) / 2 + 2.2;
    descLines.forEach((l, i) => doc.text(l, 88.5, descFirst + i * 7.2));

    if (c.impuestos.length > 0) {
      font("bold", 6);
      for (const hd of IMP_HEADERS) {
        if (hd.lines.length === 1) {
          doc.text(hd.lines[0], hd.x, descTop + 12.1, { align: "center" });
        } else {
          doc.text(hd.lines[0], hd.x, descTop + 8.2, { align: "center" });
          doc.text(hd.lines[1], hd.x, descTop + 16.1, { align: "center" });
        }
      }
      font("normal", 6);
      c.impuestos.forEach((imp, i) => {
        const by = descTop + 26 + i * 8.1;
        const vals = [
          cat.impuesto(imp.impuesto),
          imp.tipo,
          fmtImporte(imp.base),
          imp.tipoFactor,
          fmtTasa(imp.tipoFactor, imp.tasaOCuota),
          fmtImporte(imp.importe),
        ];
        IMP_HEADERS.forEach((hd, j) => {
          if (vals[j]) doc.text(vals[j], hd.vx, by, { align: "center" });
        });
      });
    }
    y = descTop + descH;

    // Número de pedimento / cuenta predial
    cellBox(X0, y, 115.2, 8.2, true);
    cellBox(X0 + 115.2, y, 115.2, 8.2, true);
    font("bold", 6);
    cellText(["Número de pedimento"], X0, 115.2, y, 8.2, 7, "center", 2.2);
    cellText(["Número de cuenta predial"], X0 + 115.2, 115.2, y, 8.2, 7, "center", 2.2);
    y += 8.2;
    cellBox(X0, y, 115.2, pedValH, false);
    cellBox(X0 + 115.2, y, 115.2, pedValH, false);
    font("normal", 5.5);
    if (c.numeroPedimento) cellText(pedLines, X0, 115.2, y, pedValH, 6.3, "center", 2.05);
    if (c.cuentaPredial) cellText(predLines, X0 + 115.2, 115.2, y, pedValH, 6.3, "center", 2.05);
    y += pedValH;
  };

  sectionTitle("Conceptos");
  if (data.conceptos.length === 0) {
    font("normal", 8);
    doc.text("Sin conceptos registrados.", LABEL_X, y + 8);
    y += 12;
  }
  data.conceptos.forEach((c, i) => {
    if (i > 0) y += 5;
    drawConcepto(c);
  });

  // ───── Moneda / forma / método + totales ─────

  const leftTot: Row[] = [
    { label: "Moneda:", value: cat.moneda(data.moneda) },
    {
      label: "Tipo de cambio:",
      value:
        data.moneda && !["MXN", "XXX"].includes(data.moneda) ? str(data.tipoCambio) : "",
    },
    { label: "Forma de pago:", value: cat.formaPago(data.formaPago) },
    { label: "Método de pago:", value: cat.metodoPago(data.metodoPago) },
    { label: "Condiciones de pago:", value: str(data.condicionesPago) },
  ].filter((row) => row.value);

  type TotRow = { label: string; imp?: string; tasa?: string; value: string; bold?: boolean };
  const rightTot: TotRow[] = [
    { label: "Subtotal", value: fmtMoney(data.subtotal) },
    { label: "Descuento", value: fmtMoney(data.descuento || 0) },
    ...data.traslados.map<TotRow>((t, i) => ({
      label: i === 0 ? "Impuestos trasladados" : "",
      imp: cat.impuesto(t.impuesto),
      tasa: fmtTasa(t.tipoFactor, t.tasaOCuota),
      value: t.importe ? fmtMoney(t.importe) : t.tipoFactor,
    })),
    ...data.retenciones.map<TotRow>((rt, i) => ({
      label: i === 0 ? "Impuestos retenidos" : "",
      imp: cat.impuesto(rt.impuesto),
      value: fmtMoney(rt.importe),
    })),
    { label: "Total", value: fmtMoney(data.total), bold: true },
  ];

  ensure(Math.max(leftTot.length * 13, rightTot.length * 10.5) + 25);
  const totTop = y;
  let leftTotLast = totTop + 19.2;
  if (leftTot.length > 0) {
    font("normal", 8);
    leftTotLast = labelValueRows(leftTot, LABEL_X, 98, 136.6, 185, totTop + 19.2);
  }
  rightTot.forEach((row, i) => {
    const by = totTop + 18.2 + i * 10.5;
    font("bold", 8);
    if (row.label) doc.text(row.label, 331.2, by);
    font("normal", 8);
    if (row.imp) doc.text(row.imp, 432.8, by);
    if (row.tasa) doc.text(row.tasa, 458.0, by);
    font(row.bold ? "bold" : "normal", 8);
    doc.text(row.value, 613.2, by, { align: "right" });
  });
  const rightTotLast = totTop + 18.2 + (rightTot.length - 1) * 10.5;
  y = Math.max(leftTotLast, rightTotLast) + 2;

  // ───── Complementos (pagos, nómina) ─────

  for (const sec of data.complementos) {
    y += 6;
    drawSeccion(sec);
  }

  // ───── Sellos, cadena original y QR ─────

  const tfd = data.timbre;
  if (tfd && data.sello) {
    font("normal", 7);
    const selloLines = wrapChars(data.sello, 578.5);
    const selloSatLines = wrapChars(tfd.selloSAT, 578.5);
    const cadena = `||${[
      tfd.version || "1.1",
      tfd.uuid,
      tfd.fechaTimbrado,
      tfd.rfcProvCertif,
      tfd.leyenda,
      tfd.selloCFD,
      tfd.noCertificadoSAT,
    ]
      .filter((v) => v !== undefined && v !== "")
      .join("|")}||`;
    const cadenaLines = wrapChars(cadena, 476);

    const selloH = 11.2 + (selloLines.length - 1) * 9.2;
    const selloSatH = 16.2 + 11.2 + (selloSatLines.length - 1) * 9.2;
    const cadenaH = 11.3 + 11.2 + (cadenaLines.length - 1) * 9.2 + 11.2 + 13 + 4;
    ensure(28.6 + selloH + selloSatH + Math.max(cadenaH, 14.4 + 78) + 4);

    let b = y + 28.6;
    font("bold", 7);
    doc.text("Sello digital del CFDI:", LABEL_X, b);
    font("normal", 7);
    selloLines.forEach((l, i) => doc.text(l, LABEL_X, b + 11.2 + i * 9.2));
    b = b + 11.2 + (selloLines.length - 1) * 9.2 + 16.2;

    font("bold", 7);
    doc.text("Sello digital del SAT:", LABEL_X, b);
    font("normal", 7);
    selloSatLines.forEach((l, i) => doc.text(l, LABEL_X, b + 11.2 + i * 9.2));
    const selloSatLast = b + 11.2 + (selloSatLines.length - 1) * 9.2;

    // QR de verificación: misma URL, versión (10), nivel de corrección (Q) y
    // tamaño (78 pt, sin margen) que el del SAT
    const qrTop = selloSatLast + 14.4;
    try {
      const qr = await QRCode.toDataURL(urlVerificacionSat(data), {
        errorCorrectionLevel: "Q",
        margin: 0,
        width: 300,
      });
      doc.addImage(qr, "PNG", 43.8, qrTop, 78, 78);
    } catch (e) {
      console.error("No se pudo generar el QR del CFDI:", e);
    }

    b = selloSatLast + 11.3;
    font("bold", 7);
    doc.text("Cadena Original del complemento de certificación digital del SAT:", 143.8, b);
    font("normal", 7);
    cadenaLines.forEach((l, i) => doc.text(l, 143.8, b + 11.2 + i * 9.2));
    b = b + 11.2 + (cadenaLines.length - 1) * 9.2 + 11.2;

    font("bold", 7);
    doc.text("RFC del proveedor de certificación:", 143.8, b);
    doc.text("Fecha y hora de certificación:", 381.4, b);
    font("normal", 7);
    doc.text(tfd.rfcProvCertif, 277.0, b);
    doc.text(tfd.fechaTimbrado.replace("T", " "), 496.6, b);
    b += 13;
    font("bold", 7);
    doc.text("No. de serie del certificado SAT", 143.8, b);
    font("normal", 7);
    doc.text(tfd.noCertificadoSAT, 277.0, b);

    y = Math.max(b + 4, qrTop + 78);
  } else {
    // Sin XML original no hay sellos que mostrar: se indica explícitamente
    ensure(60);
    const b = y + 28.6;
    font("bold", 7);
    doc.text("Sello digital del CFDI:", LABEL_X, b);
    doc.text("Sello digital del SAT:", LABEL_X, b + 27.4);
    font("normal", 7);
    doc.text("No disponible", LABEL_X, b + 11.2);
    doc.text("No disponible", LABEL_X, b + 38.6);
    y = b + 42;
  }

  // ───── Encabezado y pie en todas las páginas ─────

  const pageCount = doc.getNumberOfPages();
  const leyenda =
    data.fuente === "xml"
      ? "Este documento es una representación impresa de un CFDI"
      : "Representación generada con los datos registrados en CuentIA (XML original no disponible)";
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    font("bold", 8);
    doc.text("RFC emisor:", LABEL_X, 46.9);
    doc.text("Folio fiscal:", 302.2, 46.9);
    font("normal", 8);
    doc.text(data.emisor.rfc, 122.2, 46.9);
    doc.text(data.uuid, 453.4, 46.9);

    font("bold", 7.76);
    doc.text(leyenda, 323, 751.8, { align: "center" });
    font("normal", 7.76);
    doc.text(`Página ${p} de ${pageCount}`, 614.2, 755.8, { align: "right" });
  }

  return doc;
}
