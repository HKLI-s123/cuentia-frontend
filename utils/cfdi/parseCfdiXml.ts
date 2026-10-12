// Convierte el XML de un CFDI (3.3 / 4.0, con complementos de pago 1.0/2.0 y
// nómina 1.2) al modelo CfdiPdfData usado por renderCfdiPdf.

import type {
  CfdiConceptoPdf,
  CfdiImpuestoConcepto,
  CfdiPdfData,
  CfdiSeccionPdf,
  CfdiTablaPdf,
} from "./types";
import * as cat from "./catalogos";
import { fmtFechaHora, fmtImporte, fmtMoneyOpt, fmtTasa, str } from "./format";

// ───── helpers DOM (tolerantes a prefijos de namespace: cfdi:, tfd:, pago20:…) ─────

const kids = (el: Element | null | undefined, name: string): Element[] =>
  el ? Array.from(el.children).filter((c) => c.localName === name) : [];

const kid = (el: Element | null | undefined, name: string): Element | null =>
  kids(el, name)[0] ?? null;

const desc = (el: Element | Document | null | undefined, name: string): Element[] =>
  el ? Array.from(el.getElementsByTagNameNS("*", name)) : [];

const at = (el: Element | null | undefined, name: string) => str(el?.getAttribute(name));

// ───── conceptos ─────

const impuestosConcepto = (concepto: Element): CfdiImpuestoConcepto[] => {
  const imp = kid(concepto, "Impuestos");
  const traslados = kids(kid(imp, "Traslados"), "Traslado").map<CfdiImpuestoConcepto>((t) => ({
    impuesto: at(t, "Impuesto"),
    tipo: "Traslado",
    base: at(t, "Base"),
    tipoFactor: at(t, "TipoFactor"),
    tasaOCuota: at(t, "TasaOCuota"),
    importe: at(t, "Importe"),
  }));
  const retenciones = kids(kid(imp, "Retenciones"), "Retencion").map<CfdiImpuestoConcepto>((r) => ({
    impuesto: at(r, "Impuesto"),
    tipo: "Retención",
    base: at(r, "Base"),
    tipoFactor: at(r, "TipoFactor"),
    tasaOCuota: at(r, "TasaOCuota"),
    importe: at(r, "Importe"),
  }));
  return [...traslados, ...retenciones];
};

const parseConcepto = (c: Element): CfdiConceptoPdf => ({
  claveProdServ: at(c, "ClaveProdServ"),
  noIdentificacion: at(c, "NoIdentificacion"),
  cantidad: at(c, "Cantidad"),
  claveUnidad: at(c, "ClaveUnidad"),
  unidad: at(c, "Unidad") || cat.claveUnidad(at(c, "ClaveUnidad")),
  valorUnitario: at(c, "ValorUnitario"),
  importe: at(c, "Importe"),
  descuento: at(c, "Descuento") || "0",
  objetoImp: at(c, "ObjetoImp"),
  descripcion: at(c, "Descripcion"),
  impuestos: impuestosConcepto(c),
  numeroPedimento: kids(c, "InformacionAduanera")
    .map((i) => at(i, "NumeroPedimento"))
    .filter(Boolean)
    .join(", "),
  cuentaPredial: kids(c, "CuentaPredial")
    .map((p) => at(p, "Numero"))
    .filter(Boolean)
    .join(", "),
});

// ───── complemento de pagos (1.0 / 2.0) ─────

const impuestoDesc = (code: string) => cat.impuesto(code);

const parsePagos = (pagosEl: Element): CfdiSeccionPdf => {
  const campos: { label: string; value: string }[] = [];
  const totales = kid(pagosEl, "Totales");
  const totalesDef: [string, string][] = [
    ["MontoTotalPagos", "Monto total de pagos:"],
    ["TotalTrasladosBaseIVA16", "Total traslados base IVA 16%:"],
    ["TotalTrasladosImpuestoIVA16", "Total traslados impuesto IVA 16%:"],
    ["TotalTrasladosBaseIVA8", "Total traslados base IVA 8%:"],
    ["TotalTrasladosImpuestoIVA8", "Total traslados impuesto IVA 8%:"],
    ["TotalTrasladosBaseIVA0", "Total traslados base IVA 0%:"],
    ["TotalTrasladosImpuestoIVA0", "Total traslados impuesto IVA 0%:"],
    ["TotalTrasladosBaseIVAExento", "Total traslados base IVA exento:"],
    ["TotalRetencionesIVA", "Total retenciones IVA:"],
    ["TotalRetencionesISR", "Total retenciones ISR:"],
    ["TotalRetencionesIEPS", "Total retenciones IEPS:"],
  ];
  for (const [attr, label] of totalesDef) {
    const v = at(totales, attr);
    if (v) campos.push({ label, value: fmtMoneyOpt(v) });
  }

  const pagos = kids(pagosEl, "Pago");
  const tablas: CfdiTablaPdf[] = [];

  pagos.forEach((p, i) => {
    const sufijo = pagos.length > 1 ? ` (${i + 1} de ${pagos.length})` : "";

    tablas.push({
      titulo: `Información del pago${sufijo}`,
      columnas: [
        { header: "Fecha de pago", width: 1.1 },
        { header: "Forma de pago", width: 1.6 },
        { header: "Moneda", width: 0.9 },
        { header: "Tipo de cambio", width: 0.8 },
        { header: "Monto", width: 1 },
        { header: "Número de operación", width: 1.2 },
      ],
      filas: [
        [
          fmtFechaHora(at(p, "FechaPago")),
          cat.formaPago(at(p, "FormaDePagoP")),
          cat.moneda(at(p, "MonedaP")),
          at(p, "TipoCambioP") || "1",
          fmtMoneyOpt(at(p, "Monto")),
          at(p, "NumOperacion"),
        ],
      ],
    });

    const cuentas = [
      at(p, "RfcEmisorCtaOrd"),
      at(p, "NomBancoOrdExt"),
      at(p, "CtaOrdenante"),
      at(p, "RfcEmisorCtaBen"),
      at(p, "CtaBeneficiario"),
    ];
    if (cuentas.some(Boolean)) {
      tablas.push({
        columnas: [
          { header: "RFC emisor cuenta ordenante", width: 1 },
          { header: "Nombre del banco", width: 1.2 },
          { header: "Cuenta ordenante", width: 1 },
          { header: "RFC emisor cuenta beneficiario", width: 1 },
          { header: "Cuenta beneficiario", width: 1 },
        ],
        filas: [cuentas],
      });
    }

    const doctos = kids(p, "DoctoRelacionado");
    if (doctos.length > 0) {
      tablas.push({
        titulo: `Documentos relacionados${sufijo}`,
        columnas: [
          { header: "Id documento", width: 2.2 },
          { header: "Serie", width: 0.6 },
          { header: "Folio", width: 0.7 },
          { header: "Moneda", width: 0.6 },
          { header: "Equivalencia", width: 0.75 },
          { header: "Núm. parcialidad", width: 0.75 },
          { header: "Importe saldo anterior", width: 1 },
          { header: "Importe pagado", width: 1 },
          { header: "Importe saldo insoluto", width: 1 },
          { header: "Objeto impuesto", width: 1.1 },
        ],
        filas: doctos.map((d) => [
          at(d, "IdDocumento").toUpperCase(),
          at(d, "Serie"),
          at(d, "Folio"),
          at(d, "MonedaDR"),
          at(d, "EquivalenciaDR") || at(d, "TipoCambioDR"),
          at(d, "NumParcialidad"),
          fmtMoneyOpt(at(d, "ImpSaldoAnt")),
          fmtMoneyOpt(at(d, "ImpPagado")),
          fmtMoneyOpt(at(d, "ImpSaldoInsoluto")),
          cat.objetoImp(at(d, "ObjetoImpDR")) || cat.metodoPago(at(d, "MetodoDePagoDR")),
        ]),
      });
    }

    const impP = kid(p, "ImpuestosP");
    const filasImp = [
      ...kids(kid(impP, "TrasladosP"), "TrasladoP").map((t) => [
        impuestoDesc(at(t, "ImpuestoP")),
        "Traslado",
        fmtImporte(at(t, "BaseP")),
        at(t, "TipoFactorP"),
        fmtTasa(at(t, "TipoFactorP"), at(t, "TasaOCuotaP")),
        fmtImporte(at(t, "ImporteP")),
      ]),
      ...kids(kid(impP, "RetencionesP"), "RetencionP").map((r) => [
        impuestoDesc(at(r, "ImpuestoP")),
        "Retención",
        "",
        "",
        "",
        fmtImporte(at(r, "ImporteP")),
      ]),
    ];
    if (filasImp.length > 0) {
      tablas.push({
        titulo: `Impuestos del pago${sufijo}`,
        columnas: [
          { header: "Impuesto", width: 1 },
          { header: "Tipo", width: 1 },
          { header: "Base", width: 1.3 },
          { header: "Tipo factor", width: 1 },
          { header: "Tasa o cuota", width: 1 },
          { header: "Importe", width: 1.3 },
        ],
        filas: filasImp,
      });
    }
  });

  return { titulo: "Complemento de pago", campos, tablas };
};

// ───── complemento de nómina 1.2 ─────

const parseNomina = (nom: Element): CfdiSeccionPdf => {
  const emisor = kid(nom, "Emisor");
  const receptor = kid(nom, "Receptor");

  const campos = [
    { label: "Tipo de nómina:", value: cat.tipoNomina(at(nom, "TipoNomina")) },
    { label: "Fecha de pago:", value: at(nom, "FechaPago") },
    { label: "Fecha inicial de pago:", value: at(nom, "FechaInicialPago") },
    { label: "Fecha final de pago:", value: at(nom, "FechaFinalPago") },
    { label: "Número de días pagados:", value: at(nom, "NumDiasPagados") },
    { label: "Registro patronal:", value: at(emisor, "RegistroPatronal") },
    { label: "CURP:", value: at(receptor, "Curp") },
    { label: "Número de seguridad social:", value: at(receptor, "NumSeguridadSocial") },
    { label: "Fecha inicio relación laboral:", value: at(receptor, "FechaInicioRelLaboral") },
    { label: "Antigüedad:", value: at(receptor, "Antigüedad") },
    { label: "Número de empleado:", value: at(receptor, "NumEmpleado") },
    { label: "Departamento:", value: at(receptor, "Departamento") },
    { label: "Puesto:", value: at(receptor, "Puesto") },
    { label: "Periodicidad de pago:", value: cat.periodicidadPago(at(receptor, "PeriodicidadPago")) },
    { label: "Salario diario integrado:", value: fmtMoneyOpt(at(receptor, "SalarioDiarioIntegrado")) },
    { label: "Clave entidad federativa:", value: at(receptor, "ClaveEntFed") },
    { label: "Total percepciones:", value: fmtMoneyOpt(at(nom, "TotalPercepciones")) },
    { label: "Total deducciones:", value: fmtMoneyOpt(at(nom, "TotalDeducciones")) },
    { label: "Total otros pagos:", value: fmtMoneyOpt(at(nom, "TotalOtrosPagos")) },
  ].filter((c) => c.value);

  const tablas: CfdiTablaPdf[] = [];

  const percepciones = kids(kid(nom, "Percepciones"), "Percepcion");
  if (percepciones.length > 0) {
    tablas.push({
      titulo: "Percepciones",
      columnas: [
        { header: "Tipo", width: 0.6 },
        { header: "Clave", width: 0.8 },
        { header: "Concepto", width: 2.6 },
        { header: "Importe gravado", width: 1, align: "right" },
        { header: "Importe exento", width: 1, align: "right" },
      ],
      filas: percepciones.map((p) => [
        at(p, "TipoPercepcion"),
        at(p, "Clave"),
        at(p, "Concepto"),
        fmtMoneyOpt(at(p, "ImporteGravado")),
        fmtMoneyOpt(at(p, "ImporteExento")),
      ]),
    });
  }

  const deducciones = kids(kid(nom, "Deducciones"), "Deduccion");
  if (deducciones.length > 0) {
    tablas.push({
      titulo: "Deducciones",
      columnas: [
        { header: "Tipo", width: 0.6 },
        { header: "Clave", width: 0.8 },
        { header: "Concepto", width: 3.6 },
        { header: "Importe", width: 1, align: "right" },
      ],
      filas: deducciones.map((d) => [
        at(d, "TipoDeduccion"),
        at(d, "Clave"),
        at(d, "Concepto"),
        fmtMoneyOpt(at(d, "Importe")),
      ]),
    });
  }

  const otrosPagos = kids(kid(nom, "OtrosPagos"), "OtroPago");
  if (otrosPagos.length > 0) {
    tablas.push({
      titulo: "Otros pagos",
      columnas: [
        { header: "Tipo", width: 0.6 },
        { header: "Clave", width: 0.8 },
        { header: "Concepto", width: 2.6 },
        { header: "Importe", width: 1, align: "right" },
        { header: "Subsidio causado", width: 1, align: "right" },
      ],
      filas: otrosPagos.map((o) => [
        at(o, "TipoOtroPago"),
        at(o, "Clave"),
        at(o, "Concepto"),
        fmtMoneyOpt(at(o, "Importe")),
        fmtMoneyOpt(at(kid(o, "SubsidioAlEmpleo"), "SubsidioCausado")),
      ]),
    });
  }

  return { titulo: "Complemento de nómina", campos, tablas };
};

// ───── comprobante ─────

export function parseCfdiXml(xml: string): CfdiPdfData {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("XML de CFDI inválido");
  }

  const comp = desc(doc, "Comprobante")[0];
  if (!comp) throw new Error("El XML no contiene un nodo Comprobante");

  const emisor = kid(comp, "Emisor");
  const receptor = kid(comp, "Receptor");
  const complemento = kid(comp, "Complemento");
  const tfd = desc(complemento, "TimbreFiscalDigital")[0] ?? null;

  const impuestos = kid(comp, "Impuestos");
  const traslados = kids(kid(impuestos, "Traslados"), "Traslado").map((t) => ({
    impuesto: at(t, "Impuesto"),
    tipoFactor: at(t, "TipoFactor"),
    tasaOCuota: at(t, "TasaOCuota"),
    importe: at(t, "Importe"),
  }));
  const retenciones = kids(kid(impuestos, "Retenciones"), "Retencion").map((r) => ({
    impuesto: at(r, "Impuesto"),
    importe: at(r, "Importe"),
  }));

  // 4.0 permite varios nodos CfdiRelacionados (uno por tipo de relación)
  const relacionados = kids(comp, "CfdiRelacionados").flatMap((rel) =>
    kids(rel, "CfdiRelacionado").map((r) => ({
      tipoRelacion: at(rel, "TipoRelacion"),
      uuid: at(r, "UUID").toUpperCase(),
    }))
  );

  const infoGlobal = kid(comp, "InformacionGlobal");

  const complementos: CfdiSeccionPdf[] = [];
  const pagosEl = desc(complemento, "Pagos")[0];
  if (pagosEl) complementos.push(parsePagos(pagosEl));
  const nominaEl = desc(complemento, "Nomina")[0];
  if (nominaEl) complementos.push(parseNomina(nominaEl));

  return {
    fuente: "xml",
    version: at(comp, "Version"),
    uuid: at(tfd, "UUID").toUpperCase(),
    serie: at(comp, "Serie"),
    folio: at(comp, "Folio"),
    emisor: {
      rfc: at(emisor, "Rfc"),
      nombre: at(emisor, "Nombre"),
      regimen: at(emisor, "RegimenFiscal"),
    },
    receptor: {
      rfc: at(receptor, "Rfc"),
      nombre: at(receptor, "Nombre"),
      cp: at(receptor, "DomicilioFiscalReceptor"),
      regimen: at(receptor, "RegimenFiscalReceptor"),
      usoCfdi: at(receptor, "UsoCFDI"),
      residenciaFiscal: at(receptor, "ResidenciaFiscal"),
      numRegIdTrib: at(receptor, "NumRegIdTrib"),
    },
    noCertificado: at(comp, "NoCertificado"),
    lugarExpedicion: at(comp, "LugarExpedicion"),
    fecha: fmtFechaHora(at(comp, "Fecha")),
    tipoComprobante: at(comp, "TipoDeComprobante"),
    exportacion: at(comp, "Exportacion"),
    moneda: at(comp, "Moneda"),
    tipoCambio: at(comp, "TipoCambio"),
    formaPago: at(comp, "FormaPago"),
    metodoPago: at(comp, "MetodoPago"),
    condicionesPago: at(comp, "CondicionesDePago"),
    subtotal: at(comp, "SubTotal"),
    descuento: at(comp, "Descuento"),
    total: at(comp, "Total"),
    traslados,
    retenciones,
    conceptos: kids(kid(comp, "Conceptos"), "Concepto").map(parseConcepto),
    relacionados,
    informacionGlobal: infoGlobal
      ? {
          periodicidad: at(infoGlobal, "Periodicidad"),
          meses: at(infoGlobal, "Meses"),
          anio: at(infoGlobal, "Año"),
        }
      : undefined,
    complementos,
    sello: at(comp, "Sello"),
    timbre: tfd
      ? {
          version: at(tfd, "Version"),
          uuid: at(tfd, "UUID").toUpperCase(),
          fechaTimbrado: at(tfd, "FechaTimbrado"),
          rfcProvCertif: at(tfd, "RfcProvCertif"),
          leyenda: at(tfd, "Leyenda"),
          selloCFD: at(tfd, "SelloCFD"),
          noCertificadoSAT: at(tfd, "NoCertificadoSAT"),
          selloSAT: at(tfd, "SelloSAT"),
        }
      : undefined,
  };
}
