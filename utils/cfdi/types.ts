// Modelo intermedio para la representación impresa de un CFDI (estilo SAT).
// Se llena desde el XML original (parseCfdiXml) o, si el XML no está
// disponible, desde los datos registrados en la BD (fromDb).

export interface CfdiImpuestoConcepto {
  impuesto: string; // código SAT: 001 ISR, 002 IVA, 003 IEPS
  tipo: "Traslado" | "Retención";
  base: string;
  tipoFactor: string; // Tasa | Cuota | Exento
  tasaOCuota: string;
  importe: string;
}

export interface CfdiConceptoPdf {
  claveProdServ: string;
  noIdentificacion: string;
  cantidad: string;
  claveUnidad: string;
  unidad: string;
  valorUnitario: string;
  importe: string;
  descuento: string;
  objetoImp: string;
  descripcion: string;
  impuestos: CfdiImpuestoConcepto[];
  numeroPedimento: string;
  cuentaPredial: string;
}

// Bloque genérico para complementos (pagos, nómina): campos etiqueta/valor
// y tablas con encabezado gris, como en la representación del SAT.
export interface CfdiTablaPdf {
  titulo?: string;
  columnas: { header: string; width: number; align?: "left" | "center" | "right" }[];
  filas: string[][];
}

export interface CfdiSeccionPdf {
  titulo: string;
  campos?: { label: string; value: string }[];
  tablas?: CfdiTablaPdf[];
}

export interface CfdiTimbrePdf {
  version: string;
  uuid: string;
  fechaTimbrado: string;
  rfcProvCertif: string;
  leyenda?: string;
  selloCFD: string;
  noCertificadoSAT: string;
  selloSAT: string;
}

export interface CfdiPdfData {
  fuente: "xml" | "db";
  version?: string;
  uuid: string;
  serie?: string;
  folio?: string;
  emisor: { rfc: string; nombre: string; regimen?: string };
  receptor: {
    rfc: string;
    nombre: string;
    cp?: string;
    regimen?: string;
    usoCfdi?: string;
    residenciaFiscal?: string;
    numRegIdTrib?: string;
  };
  noCertificado?: string;
  lugarExpedicion?: string;
  fecha: string; // "AAAA-MM-DD hh:mm:ss" (o solo fecha si viene de BD)
  tipoComprobante: string; // I, E, T, N, P
  exportacion?: string;
  moneda?: string;
  tipoCambio?: string;
  formaPago?: string;
  metodoPago?: string;
  condicionesPago?: string;
  subtotal: string;
  descuento?: string;
  total: string;
  traslados: { impuesto: string; tipoFactor: string; tasaOCuota: string; importe: string }[];
  retenciones: { impuesto: string; importe: string }[];
  conceptos: CfdiConceptoPdf[];
  relacionados: { tipoRelacion: string; uuid: string }[];
  informacionGlobal?: { periodicidad: string; meses: string; anio: string };
  complementos: CfdiSeccionPdf[];
  sello?: string;
  timbre?: CfdiTimbrePdf;
}
