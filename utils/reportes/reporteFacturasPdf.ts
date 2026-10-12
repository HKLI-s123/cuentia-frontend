// PDF del "Reporte detallado" de /dashboard/facturas. Mismo contenido que el
// Excel (por mes: Ingresos / Egresos / Nómina con totales, resumen mensual y
// retenciones) y la variante "Conceptos de facturas".

import jsPDF from "jspdf";
import autoTable, { type CellHookData, type RowInput } from "jspdf-autotable";
import type { Factura } from "@/app/types/factura";

// 🎨 Paleta de marca Cuentia
const TEAL: [number, number, number] = [26, 179, 148];
const INDIGO: [number, number, number] = [107, 94, 174];
const DARK: [number, number, number] = [46, 46, 58];
const GRAY: [number, number, number] = [138, 143, 163];
const ZEBRA: [number, number, number] = [244, 245, 249];
const EFECTIVO: [number, number, number] = [204, 255, 204]; // mismo verde que el Excel

const MARGIN = 24;
const FOOTER_SPACE = 30;

const toNum = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

const money = (v: unknown) => {
  const n = toNum(v);
  const s = Math.abs(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${s}` : `$${s}`;
};

const fmtFecha = (v: unknown) => {
  const s = String(v ?? "").substring(0, 10);
  return s.includes("-") ? s.split("-").reverse().join("/") : s;
};

/** Convierte a pesos con el tipo de cambio de la factura (igual que el Excel). */
const toPesos = (f: { moneda?: string; tipocambio?: unknown }, valor: unknown) => {
  const factor = f.moneda && f.moneda !== "MXN" ? toNum(f.tipocambio || 1) || 1 : 1;
  return Math.round(toNum(valor) * factor * 100) / 100;
};

const mesKey = (fecha: string) => String(fecha ?? "").substring(0, 7); // AAAA-MM
const mesLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key || "Sin fecha";
  const s = new Date(y, m - 1, 1).toLocaleString("es-MX", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface Encabezado {
  titulo: string;
  rfc: string;
  nombreCliente: string;
  fechaInicio: string;
  fechaFin: string;
  detalle?: string;
}

const lastY = (doc: jsPDF) => (doc as any).lastAutoTable?.finalY ?? MARGIN;

const nuevoDoc = () =>
  new jsPDF({ unit: "pt", format: "letter", orientation: "landscape", compress: true });

/** Banda de título en la primera página. Devuelve la Y donde sigue el contenido. */
const dibujarEncabezado = (doc: jsPDF, enc: Encabezado) => {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 58, "F");
  doc.setFillColor(...INDIGO);
  doc.rect(0, 58, W, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(enc.titulo, MARGIN, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${enc.nombreCliente} (${enc.rfc})  ·  Periodo: ${fmtFecha(enc.fechaInicio)} al ${fmtFecha(enc.fechaFin)}` +
      (enc.detalle ? `  ·  ${enc.detalle}` : ""),
    MARGIN,
    44
  );
  doc.setFontSize(8);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}`,
    W - MARGIN,
    26,
    { align: "right" }
  );
  doc.setTextColor(0, 0, 0);
  return 76;
};

const dibujarPies = (doc: jsPDF, texto: string) => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, H - 22, W - MARGIN, H - 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(texto, MARGIN, H - 12);
    doc.text(`Página ${p} de ${total}`, W - MARGIN, H - 12, { align: "right" });
  }
  doc.setTextColor(0, 0, 0);
};

/** Asegura espacio vertical; si no cabe, agrega página. Devuelve la Y utilizable. */
const espacio = (doc: jsPDF, y: number, h: number) => {
  const H = doc.internal.pageSize.getHeight();
  if (y + h > H - FOOTER_SPACE - 10) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
};

const barraTitulo = (
  doc: jsPDF,
  y: number,
  texto: string,
  color: [number, number, number],
  alto = 18,
  size = 10
) => {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...color);
  doc.roundedRect(MARGIN, y, W - MARGIN * 2, alto, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.text(texto, MARGIN + 8, y + alto / 2 + size * 0.35);
  doc.setTextColor(0, 0, 0);
  return y + alto + 4;
};

const tarjetas = (doc: jsPDF, y: number, items: { label: string; valor: string; sub?: string; color: [number, number, number] }[]) => {
  const W = doc.internal.pageSize.getWidth();
  const gap = 10;
  const w = (W - MARGIN * 2 - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = MARGIN + i * (w + gap);
    doc.setDrawColor(230, 232, 239);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, 46, 4, 4, "FD");
    doc.setFillColor(...it.color);
    doc.rect(x, y + 6, 3, 34, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(it.label.toUpperCase(), x + 12, y + 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text(it.valor, x + 12, y + 32);
    if (it.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(it.sub, x + 12, y + 41);
    }
  });
  doc.setTextColor(0, 0, 0);
  return y + 46 + 14;
};

const baseTabla = {
  theme: "grid" as const,
  margin: { left: MARGIN, right: MARGIN, top: MARGIN + 10, bottom: FOOTER_SPACE + 4 },
  styles: {
    font: "helvetica",
    fontSize: 6.5,
    cellPadding: 2.5,
    lineColor: [222, 225, 234] as [number, number, number],
    lineWidth: 0.4,
    textColor: DARK,
    overflow: "linebreak" as const,
    valign: "middle" as const,
  },
  headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: "bold" as const, halign: "center" as const },
  footStyles: { fillColor: DARK, textColor: 255, fontStyle: "bold" as const, halign: "right" as const },
  alternateRowStyles: { fillColor: ZEBRA },
};

// ============================================================
// Reporte de facturas (TODO / PUE / PPD)
// ============================================================

export function generarReporteFacturasPdf(opts: {
  facturas: Factura[];
  rfc: string;
  nombreCliente: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: "TODO" | "PUE" | "PPD";
}): jsPDF {
  const { facturas, rfc } = opts;
  const doc = nuevoDoc();

  const detalle =
    opts.tipo === "PUE" ? "Solo facturas PUE" : opts.tipo === "PPD" ? "Solo facturas PPD" : "Todas las facturas";
  let y = dibujarEncabezado(doc, {
    titulo: "Reporte de Facturas",
    rfc,
    nombreCliente: opts.nombreCliente,
    fechaInicio: opts.fechaInicio,
    fechaFin: opts.fechaFin,
    detalle,
  });

  const esIngreso = (f: Factura) => f.movimiento === "Ingreso";
  const esEgreso = (f: Factura) => f.movimiento === "Egreso";
  const esNomina = (f: Factura) => f.movimiento === "Nomina";
  const sumTotal = (arr: Factura[]) => arr.reduce((a, f) => a + toPesos(f, f.total), 0);

  const ingresos = facturas.filter(esIngreso);
  const egresos = facturas.filter(esEgreso);
  const nomina = facturas.filter(esNomina);

  y = tarjetas(doc, y, [
    { label: "Ingresos", valor: money(sumTotal(ingresos)), sub: `${ingresos.length} facturas`, color: TEAL },
    { label: "Egresos", valor: money(sumTotal(egresos)), sub: `${egresos.length} facturas`, color: INDIGO },
    { label: "Nómina", valor: money(sumTotal(nomina)), sub: `${nomina.length} recibos`, color: GRAY },
    {
      label: "Neto (ingresos - egresos)",
      valor: money(sumTotal(ingresos) - sumTotal(egresos)),
      sub: `${facturas.length} CFDI en total`,
      color: DARK,
    },
  ]);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    "Importes en MXN (convertidos con el tipo de cambio de cada factura). Fondo verde: facturas pagadas en efectivo (forma de pago 01).",
    MARGIN,
    y - 4
  );
  doc.setTextColor(0, 0, 0);
  y += 6;

  // Agrupar por mes (cronológico)
  const porMes = new Map<string, Factura[]>();
  [...facturas]
    .sort((a, b) => String(a.fecha_emision).localeCompare(String(b.fecha_emision)))
    .forEach((f) => {
      const k = mesKey(f.fecha_emision);
      if (!porMes.has(k)) porMes.set(k, []);
      porMes.get(k)!.push(f);
    });

  const secciones = [
    { titulo: "Ingresos", tercero: "Cliente", color: TEAL, filtro: esIngreso },
    { titulo: "Egresos", tercero: "Proveedor", color: INDIGO, filtro: esEgreso },
    { titulo: "Nómina", tercero: "Empleado", color: GRAY, filtro: esNomina },
  ];

  const head = (tercero: string) => [
    [
      "Fecha",
      "UUID",
      tercero,
      "RFC",
      "Subtotal",
      "IVA 8%",
      "IVA 16%",
      "Ret. ISR",
      "Ret. IVA",
      "Descuento",
      "Total",
      "Moneda",
      "Método",
      "F. pago",
      "Estatus",
    ],
  ];

  const montoCols = [4, 5, 6, 7, 8, 9, 10];

  for (const [mes, facturasMes] of porMes) {
    y = espacio(doc, y, 60);
    y = barraTitulo(doc, y, mesLabel(mes), DARK, 20, 11);

    for (const sec of secciones) {
      const data = facturasMes.filter(sec.filtro);
      if (data.length === 0) continue;

      // Egresos agrupados por proveedor, como en el Excel
      if (sec.titulo === "Egresos") {
        data.sort(
          (a, b) =>
            String(a.cliente?.nombre ?? "").localeCompare(String(b.cliente?.nombre ?? "")) ||
            String(a.fecha_emision).localeCompare(String(b.fecha_emision))
        );
      }

      y = espacio(doc, y, 50);
      y = barraTitulo(doc, y, `${sec.titulo} · ${data.length}`, sec.color, 15, 8.5);

      const body = data.map((f) => [
        fmtFecha(f.fecha_emision),
        String(f.uuid ?? "").toUpperCase(),
        f.cliente?.nombre || "—",
        f.rfc_emisor === rfc ? f.rfc_receptor : f.rfc_emisor,
        money(toPesos(f, f.subtotal)),
        money(toPesos(f, f.iva8)),
        money(toPesos(f, f.iva16)),
        money(toPesos(f, f.retencionisr)),
        money(toPesos(f, f.retencioniva)),
        money(toPesos(f, f.descuento)),
        money(toPesos(f, f.total)),
        f.moneda && f.moneda !== "MXN" ? `${f.moneda} ${toNum(f.tipocambio)}` : f.moneda || "MXN",
        f.metodopago || "",
        f.tipopago || "",
        f.status || "",
      ]);

      const suma = (campo: keyof Factura) => data.reduce((a, f) => a + toPesos(f, f[campo]), 0);
      const foot = [
        [
          { content: `TOTAL ${sec.titulo.toUpperCase()}`, colSpan: 4, styles: { halign: "right" as const } },
          money(suma("subtotal")),
          money(suma("iva8")),
          money(suma("iva16")),
          money(suma("retencionisr")),
          money(suma("retencioniva")),
          money(suma("descuento")),
          money(suma("total")),
          { content: "", colSpan: 4 },
        ],
      ];

      autoTable(doc, {
        ...baseTabla,
        startY: y,
        head: head(sec.tercero),
        body,
        foot: foot as RowInput[],
        showFoot: "lastPage",
        columnStyles: {
          0: { cellWidth: 40, halign: "center" },
          1: { cellWidth: 126, fontSize: 5.6 },
          2: { cellWidth: 98 },
          3: { cellWidth: 56 },
          ...Object.fromEntries(montoCols.map((c) => [c, { halign: "right" as const }])),
          11: { cellWidth: 30, halign: "center" },
          12: { cellWidth: 28, halign: "center" },
          13: { cellWidth: 26, halign: "center" },
          14: { cellWidth: 38, halign: "center" },
        },
        didParseCell: (hook: CellHookData) => {
          if (hook.section !== "body") return;
          const f = data[hook.row.index];
          if (f?.tipopago === "01") hook.cell.styles.fillColor = EFECTIVO;
          if (hook.column.index === 14 && f?.status && f.status !== "Vigente") {
            hook.cell.styles.textColor = [192, 57, 43];
          }
        },
      });
      y = lastY(doc) + 10;
    }
  }

  // ───── Resumen por mes ─────
  y = espacio(doc, y, 90);
  y = barraTitulo(doc, y, "Resumen por mes", TEAL, 20, 11);

  const resumen = Array.from(porMes.entries()).map(([mes, fs]) => {
    const ing = sumTotal(fs.filter(esIngreso));
    const egr = sumTotal(fs.filter(esEgreso));
    const nom = sumTotal(fs.filter(esNomina));
    const ivaEgr = fs.filter(esEgreso).reduce((a, f) => a + toPesos(f, f.iva16) + toPesos(f, f.iva8), 0);
    const retEgr = fs.filter(esEgreso).reduce((a, f) => a + toPesos(f, f.totalretenidos), 0);
    return { mes, n: fs.length, ing, egr, nom, ivaEgr, retEgr, neto: ing - egr };
  });
  const tot = resumen.reduce(
    (a, r) => ({
      n: a.n + r.n,
      ing: a.ing + r.ing,
      egr: a.egr + r.egr,
      nom: a.nom + r.nom,
      ivaEgr: a.ivaEgr + r.ivaEgr,
      retEgr: a.retEgr + r.retEgr,
      neto: a.neto + r.neto,
    }),
    { n: 0, ing: 0, egr: 0, nom: 0, ivaEgr: 0, retEgr: 0, neto: 0 }
  );

  autoTable(doc, {
    ...baseTabla,
    startY: y,
    styles: { ...baseTabla.styles, fontSize: 8 },
    head: [["Mes", "CFDI", "Total ingresos", "Total egresos", "Nómina", "IVA egresos", "Retenciones egresos", "Neto"]],
    body: resumen.map((r) => [
      mesLabel(r.mes),
      String(r.n),
      money(r.ing),
      money(r.egr),
      money(r.nom),
      money(r.ivaEgr),
      money(r.retEgr),
      money(r.neto),
    ]),
    foot: [
      [
        { content: "TOTAL", styles: { halign: "left" } },
        { content: String(tot.n), styles: { halign: "center" } },
        money(tot.ing),
        money(tot.egr),
        money(tot.nom),
        money(tot.ivaEgr),
        money(tot.retEgr),
        money(tot.neto),
      ],
    ] as RowInput[],
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
    didParseCell: (hook: CellHookData) => {
      if (hook.column.index !== 7 || hook.section === "head") return;
      const valor = hook.section === "foot" ? tot.neto : resumen[hook.row.index]?.neto ?? 0;
      if (hook.section === "body") hook.cell.styles.textColor = valor >= 0 ? [20, 140, 110] : [192, 57, 43];
      else hook.cell.styles.fillColor = valor >= 0 ? [20, 140, 110] : [192, 57, 43];
    },
  });
  y = lastY(doc) + 14;

  // ───── Retenciones ─────
  const retenidas = facturas.filter((f) => toNum(f.totalretenidos) > 0);
  if (retenidas.length > 0) {
    y = espacio(doc, y, 80);
    y = barraTitulo(doc, y, "Retenciones", INDIGO, 20, 11);
    autoTable(doc, {
      ...baseTabla,
      startY: y,
      styles: { ...baseTabla.styles, fontSize: 7 },
      head: [["Mes", "Contraparte", "RFC emisor", "RFC receptor", "Fecha", "Total", "Ret. ISR", "Ret. IVA", "Total retenido", "Estatus"]],
      body: retenidas
        .sort((a, b) => String(a.fecha_emision).localeCompare(String(b.fecha_emision)))
        .map((f) => [
          mesLabel(mesKey(f.fecha_emision)),
          f.cliente?.nombre || "—",
          f.rfc_emisor,
          f.rfc_receptor,
          fmtFecha(f.fecha_emision),
          money(toPesos(f, f.total)),
          money(toPesos(f, f.retencionisr)),
          money(toPesos(f, f.retencioniva)),
          money(toPesos(f, f.totalretenidos)),
          f.status || "",
        ]),
      foot: [
        [
          { content: "TOTAL RETENIDO", colSpan: 8, styles: { halign: "right" } },
          money(retenidas.reduce((a, f) => a + toPesos(f, f.totalretenidos), 0)),
          "",
        ],
      ] as RowInput[],
      showFoot: "lastPage",
      columnStyles: {
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "center" },
      },
    });
  }

  if (facturas.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No hay facturas en el periodo seleccionado.", MARGIN, y + 10);
  }

  dibujarPies(doc, `CuentIA · Reporte de facturas · ${rfc}`);
  return doc;
}

// ============================================================
// Conceptos de facturas
// ============================================================

export function generarReporteConceptosPdf(opts: {
  facturasConConceptos: any[];
  rfc: string;
  nombreCliente: string;
  fechaInicio: string;
  fechaFin: string;
}): jsPDF {
  const { facturasConConceptos, rfc } = opts;
  const doc = nuevoDoc();

  let y = dibujarEncabezado(doc, {
    titulo: "Conceptos de Facturas",
    rfc,
    nombreCliente: opts.nombreCliente,
    fechaInicio: opts.fechaInicio,
    fechaFin: opts.fechaFin,
  });

  const head = [
    [
      "Clave",
      "Descripción",
      "Cantidad",
      "Unidad",
      "Valor unitario",
      "Importe",
      "Descuento",
      "IVA 16%",
      "IVA 8%",
      "IEPS",
      "Ret. IVA",
      "Ret. ISR",
      "Total trasladado",
      "Total retenido",
    ],
  ];
  const NCOLS = head[0].length;

  // ───── Hoja 1: cada factura con sus conceptos ─────
  y = barraTitulo(doc, y, "Facturas y conceptos", TEAL, 20, 11);

  const body: RowInput[] = [];
  const tot = { importe: 0, descuento: 0, iva16: 0, iva8: 0, ieps: 0, retIva: 0, retIsr: 0, tras: 0, ret: 0 };

  facturasConConceptos.forEach((f: any) => {
    const movimiento = f.movimiento || (f.rfc_emisor === rfc ? "Ingreso" : "Egreso");
    const contraparte =
      f.rfc_emisor === rfc
        ? `${f.razonsocialreceptor || ""} (${f.rfc_receptor || ""})`
        : `${f.razonsocialemisor || ""} (${f.rfc_emisor || ""})`;
    body.push([
      {
        content: `${fmtFecha(f.fecha || f.fecha_emision)}  ·  ${movimiento}  ·  ${contraparte}  ·  UUID ${String(
          f.uuid ?? ""
        ).toUpperCase()}  ·  ${f.metodopago || ""} ${f.tipopago ? `/ FP ${f.tipopago}` : ""}  ·  Total ${money(f.total)}${
          f.moneda && f.moneda !== "MXN" ? ` ${f.moneda}` : ""
        }`,
        colSpan: NCOLS,
        styles: { fillColor: [228, 246, 241], fontStyle: "bold", textColor: DARK, halign: "left" },
      },
    ]);

    const conceptos: any[] = Array.isArray(f.conceptos) ? f.conceptos : [];
    if (conceptos.length === 0) {
      body.push([{ content: "(Sin conceptos)", colSpan: NCOLS, styles: { textColor: GRAY, fontStyle: "italic" } }]);
      return;
    }
    conceptos.forEach((c) => {
      tot.importe += toNum(c.importe);
      tot.descuento += toNum(c.descuento);
      tot.iva16 += toNum(c.iva16);
      tot.iva8 += toNum(c.iva8);
      tot.ieps += toNum(c.ieps_trasladado);
      tot.retIva += toNum(c.retencion_iva);
      tot.retIsr += toNum(c.retencion_isr);
      tot.tras += toNum(c.total_trasladado);
      tot.ret += toNum(c.total_retenido);
      body.push([
        c.clave_prod_serv || c.claveprodserv || "",
        c.descripcion || "",
        String(toNum(c.cantidad)),
        c.unidad || c.clave_unidad || c.claveunidad || "",
        money(c.valor_unitario ?? c.valorunitario),
        money(c.importe),
        money(c.descuento),
        money(c.iva16),
        money(c.iva8),
        money(c.ieps_trasladado),
        money(c.retencion_iva),
        money(c.retencion_isr),
        money(c.total_trasladado),
        money(c.total_retenido),
      ]);
    });
  });

  const montoStyles = Object.fromEntries(
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((c) => [c, { halign: "right" as const }])
  );

  autoTable(doc, {
    ...baseTabla,
    startY: y,
    head,
    body,
    foot: [
      [
        { content: "TOTALES", colSpan: 5, styles: { halign: "right" } },
        money(tot.importe),
        money(tot.descuento),
        money(tot.iva16),
        money(tot.iva8),
        money(tot.ieps),
        money(tot.retIva),
        money(tot.retIsr),
        money(tot.tras),
        money(tot.ret),
      ],
    ] as RowInput[],
    showFoot: "lastPage",
    alternateRowStyles: {},
    columnStyles: {
      0: { cellWidth: 46, halign: "center" },
      1: { cellWidth: 170 },
      2: { halign: "center" },
      3: { halign: "center" },
      ...montoStyles,
    },
  });

  // ───── Hoja 2: conceptos agrupados ─────
  type Grupo = {
    descripcion: string;
    clave: string;
    facturas: Set<string>;
    cantidad: number;
    importe: number;
    iva16: number;
    iva8: number;
    ieps: number;
    retIva: number;
    retIsr: number;
  };
  const grupos = new Map<string, Grupo>();
  facturasConConceptos.forEach((f: any) => {
    (Array.isArray(f.conceptos) ? f.conceptos : []).forEach((c: any) => {
      const descripcion = String(c.descripcion || "(Sin descripción)").trim();
      const clave = c.clave_prod_serv || c.claveprodserv || "";
      const key = `${descripcion}__${clave}`;
      if (!grupos.has(key)) {
        grupos.set(key, {
          descripcion,
          clave,
          facturas: new Set(),
          cantidad: 0,
          importe: 0,
          iva16: 0,
          iva8: 0,
          ieps: 0,
          retIva: 0,
          retIsr: 0,
        });
      }
      const g = grupos.get(key)!;
      g.facturas.add(String(f.uuid));
      g.cantidad += toNum(c.cantidad);
      g.importe += toNum(c.importe);
      g.iva16 += toNum(c.iva16);
      g.iva8 += toNum(c.iva8);
      g.ieps += toNum(c.ieps_trasladado);
      g.retIva += toNum(c.retencion_iva);
      g.retIsr += toNum(c.retencion_isr);
    });
  });
  const ordenados = Array.from(grupos.values()).sort((a, b) => b.importe - a.importe);

  if (ordenados.length > 0) {
    doc.addPage();
    y = barraTitulo(doc, MARGIN + 10, "Conceptos agrupados", INDIGO, 20, 11);
    autoTable(doc, {
      ...baseTabla,
      startY: y,
      styles: { ...baseTabla.styles, fontSize: 7 },
      head: [["Descripción", "Clave", "Facturas", "Cantidad", "Importe", "IVA 16%", "IVA 8%", "IEPS", "Ret. IVA", "Ret. ISR"]],
      body: ordenados.map((g) => [
        g.descripcion,
        g.clave,
        String(g.facturas.size),
        g.cantidad.toLocaleString("es-MX", { maximumFractionDigits: 4 }),
        money(g.importe),
        money(g.iva16),
        money(g.iva8),
        money(g.ieps),
        money(g.retIva),
        money(g.retIsr),
      ]),
      foot: [
        [
          { content: "TOTAL", colSpan: 4, styles: { halign: "right" } },
          money(tot.importe),
          money(tot.iva16),
          money(tot.iva8),
          money(tot.ieps),
          money(tot.retIva),
          money(tot.retIsr),
        ],
      ] as RowInput[],
      showFoot: "lastPage",
      columnStyles: {
        0: { cellWidth: 240 },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right" },
      },
    });
  }

  dibujarPies(doc, `CuentIA · Conceptos de facturas · ${rfc}`);
  return doc;
}
