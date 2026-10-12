// Respaldo cuando el XML original no está disponible: arma el modelo del PDF
// con los datos que ya están en la BD (cfdis / conceptos_cfdis / pagos_cfdi).
// No incluye sellos, certificados ni cadena original (no se guardan en BD).

import type { CfdiConceptoPdf, CfdiImpuestoConcepto, CfdiPdfData, CfdiTablaPdf } from "./types";
import * as cat from "./catalogos";
import { fmtMoneyOpt, str } from "./format";

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

/** "25.00" → "25", "48.840" → "48.84" (como se ve en el XML) */
const trimNum = (v: unknown) => {
  const s = str(v);
  if (!s) return "";
  const n = parseFloat(s);
  return Number.isFinite(n) ? String(n) : s;
};

const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) {
    if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== "") return o[k];
  }
  return undefined;
};

const impuestosConceptoDb = (c: any): CfdiImpuestoConcepto[] => {
  const out: CfdiImpuestoConcepto[] = [];
  const traslado = (impuesto: string, base: unknown, tipoFactor: string, tasa: string, importe: unknown) =>
    out.push({
      impuesto,
      tipo: "Traslado",
      base: str(base),
      tipoFactor,
      tasaOCuota: tasa,
      importe: str(importe),
    });
  const retencion = (impuesto: string, importe: unknown) =>
    out.push({ impuesto, tipo: "Retención", base: "", tipoFactor: "", tasaOCuota: "", importe: str(importe) });

  if (num(c.base_iva16) || num(c.iva16)) traslado("002", c.base_iva16, "Tasa", "0.160000", c.iva16);
  if (num(c.base_iva8) || num(c.iva8)) traslado("002", c.base_iva8, "Tasa", "0.080000", c.iva8);
  if (num(c.base_iva0)) traslado("002", c.base_iva0, "Tasa", "0.000000", 0);
  if (num(c.base_exento)) traslado("002", c.base_exento, "Exento", "", "");
  if (num(c.ieps_trasladado)) traslado("003", "", "", "", c.ieps_trasladado);
  if (num(c.retencion_iva)) retencion("002", c.retencion_iva);
  if (num(c.retencion_isr)) retencion("001", c.retencion_isr);
  if (num(c.retencion_ieps)) retencion("003", c.retencion_ieps);
  return out;
};

const conceptoDb = (c: any): CfdiConceptoPdf => {
  const claveUnidad = str(pick(c, "clave_unidad", "claveunidad"));
  return {
    claveProdServ: str(pick(c, "clave_prod_serv", "claveprodserv", "claveproductoservicio")),
    noIdentificacion: str(pick(c, "no_identificacion", "noidentificacion")),
    cantidad: trimNum(c.cantidad),
    claveUnidad,
    unidad: str(c.unidad) || cat.claveUnidad(claveUnidad),
    valorUnitario: trimNum(pick(c, "valor_unitario", "valorunitario")),
    importe: str(c.importe),
    descuento: trimNum(c.descuento) || "0",
    objetoImp: str(c.objeto_imp),
    descripcion: str(c.descripcion),
    impuestos: impuestosConceptoDb(c),
    numeroPedimento: "",
    cuentaPredial: "",
  };
};

/** Factura (fila de /cfdis) + sus conceptos (fila de facturas-con-conceptos). */
export function facturaFromDb(f: any, conceptos: any[]): CfdiPdfData {
  const traslados: CfdiPdfData["traslados"] = [];
  if (num(f.iva16)) traslados.push({ impuesto: "002", tipoFactor: "Tasa", tasaOCuota: "0.160000", importe: str(f.iva16) });
  if (num(f.iva8)) traslados.push({ impuesto: "002", tipoFactor: "Tasa", tasaOCuota: "0.080000", importe: str(f.iva8) });

  const retenciones: CfdiPdfData["retenciones"] = [];
  if (num(f.retencionisr)) retenciones.push({ impuesto: "001", importe: str(f.retencionisr) });
  if (num(f.retencioniva)) retenciones.push({ impuesto: "002", importe: str(f.retencioniva) });
  if (num(f.retencionieps)) retenciones.push({ impuesto: "003", importe: str(f.retencionieps) });

  return {
    fuente: "db",
    uuid: str(f.uuid).toUpperCase(),
    folio: str(f.folio),
    emisor: { rfc: str(f.rfc_emisor), nombre: str(f.razonsocialemisor), regimen: str(f.regimenfiscal) },
    receptor: {
      rfc: str(f.rfc_receptor),
      nombre: str(f.razonsocialreceptor),
      regimen: str(f.regimenfiscalreceptor),
      usoCfdi: str(f.usocfdi),
    },
    fecha: str(f.fecha_emision ?? f.fecha).substring(0, 10),
    tipoComprobante: str(f.tipocomprobante),
    moneda: str(f.moneda) || "MXN",
    tipoCambio: str(f.tipocambio),
    formaPago: str(f.tipopago),
    metodoPago: str(f.metodopago),
    subtotal: str(f.subtotal) || "0",
    descuento: str(f.descuento),
    total: str(f.total) || "0",
    traslados,
    retenciones,
    conceptos: (conceptos ?? []).map(conceptoDb),
    relacionados: [],
    complementos: [],
  };
}

/** Complemento de pago: fila representativa + todas sus filas (documentos relacionados). */
export function complementoFromDb(pago: any, documentos: any[]): CfdiPdfData {
  const docs = documentos?.length ? documentos : [pago];

  const campos = [
    { label: "Monto total de pagos:", value: fmtMoneyOpt(pago.monto) },
    { label: "Total traslados base IVA 16%:", value: num(pago.base_16) ? fmtMoneyOpt(pago.base_16) : "" },
    {
      label: "Total traslados impuesto IVA 16%:",
      value: num(pago.importe_trasladado_16) ? fmtMoneyOpt(pago.importe_trasladado_16) : "",
    },
    { label: "Total traslados base IVA 8%:", value: num(pago.base_8) ? fmtMoneyOpt(pago.base_8) : "" },
    {
      label: "Total traslados impuesto IVA 8%:",
      value: num(pago.importe_trasladado_8) ? fmtMoneyOpt(pago.importe_trasladado_8) : "",
    },
    {
      label: "Total traslados base IVA exento:",
      value: num(pago.base_exento) ? fmtMoneyOpt(pago.base_exento) : "",
    },
    {
      label: "Total retenciones:",
      value: num(pago.total_imp_retenidos) ? fmtMoneyOpt(pago.total_imp_retenidos) : "",
    },
  ].filter((c) => c.value);

  const tablas: CfdiTablaPdf[] = [
    {
      titulo: "Información del pago",
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
          str(pago.fecha_pago).substring(0, 10),
          cat.formaPago(pago.forma_pago),
          cat.moneda(pago.moneda_pago || "MXN"),
          trimNum(pago.tipo_cambio_pago) || "1",
          fmtMoneyOpt(pago.monto),
          str(pago.no_operacion),
        ],
      ],
    },
  ];

  const cuentas = [
    str(pago.rfc_cta_ordenante),
    str(pago.banco_ordenante),
    str(pago.cta_ordenante),
    str(pago.rfc_cta_beneficiario),
    str(pago.cta_beneficiario),
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

  const conDocto = docs.filter((d) => str(d.uuid_factura));
  if (conDocto.length > 0) {
    tablas.push({
      titulo: "Documentos relacionados",
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
      filas: conDocto.map((d) => [
        str(d.uuid_factura).toUpperCase(),
        str(d.serie),
        str(d.folio),
        str(d.moneda_dr),
        trimNum(d.equivalencia_dr),
        str(d.num_parcialidad),
        fmtMoneyOpt(d.imp_saldo_ant),
        fmtMoneyOpt(d.imp_pagado),
        fmtMoneyOpt(d.imp_saldo_insoluto),
        cat.objetoImp(d.objeto_imp_dr) || cat.metodoPago(d.metodo_pago_dr),
      ]),
    });
  }

  return {
    fuente: "db",
    uuid: str(pago.uuid_complemento).toUpperCase(),
    emisor: { rfc: str(pago.rfc_emisor), nombre: str(pago.nombre_emisor), regimen: str(pago.regimen_emisor) },
    receptor: {
      rfc: str(pago.rfc_receptor),
      nombre: str(pago.nombre_receptor),
      regimen: str(pago.regimen_receptor),
      usoCfdi: "CP01",
    },
    fecha: str(pago.fecha_emision).substring(0, 10),
    tipoComprobante: "P",
    exportacion: "01",
    moneda: "XXX",
    subtotal: "0",
    total: "0",
    traslados: [],
    retenciones: [],
    // Concepto fijo que exige el Anexo 20 para CFDI de pago
    conceptos: [
      {
        claveProdServ: "84111506",
        noIdentificacion: "",
        cantidad: "1",
        claveUnidad: "ACT",
        unidad: "",
        valorUnitario: "0",
        importe: "0",
        descuento: "0",
        objetoImp: "01",
        descripcion: "Pago",
        impuestos: [],
        numeroPedimento: "",
        cuentaPredial: "",
      },
    ],
    relacionados: [],
    complementos: [{ titulo: "Complemento de pago", campos, tablas }],
  };
}
