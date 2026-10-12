// Catálogos SAT (Anexo 20) con las descripciones que usa la representación
// impresa del SAT. Si un código no está en el catálogo se muestra el código.

const lookup = (cat: Record<string, string>) => (code?: string | null) => {
  const c = String(code ?? "").trim();
  if (!c) return "";
  return cat[c] ?? cat[c.toUpperCase()] ?? c;
};

export const REGIMEN_FISCAL: Record<string, string> = {
  "601": "General de Ley Personas Morales",
  "603": "Personas Morales con Fines no Lucrativos",
  "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "606": "Arrendamiento",
  "607": "Régimen de Enajenación o Adquisición de Bienes",
  "608": "Demás ingresos",
  "609": "Consolidación",
  "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
  "611": "Ingresos por Dividendos (socios y accionistas)",
  "612": "Personas Físicas con Actividades Empresariales y Profesionales",
  "614": "Ingresos por intereses",
  "615": "Régimen de los ingresos por obtención de premios",
  "616": "Sin obligaciones fiscales",
  "620": "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  "621": "Incorporación Fiscal",
  "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  "623": "Opcional para Grupos de Sociedades",
  "624": "Coordinados",
  "625": "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  "626": "Régimen Simplificado de Confianza",
  "628": "Hidrocarburos",
  "629": "De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales",
  "630": "Enajenación de acciones en bolsa de valores",
};

export const USO_CFDI: Record<string, string> = {
  G01: "Adquisición de mercancías.",
  G02: "Devoluciones, descuentos o bonificaciones.",
  G03: "Gastos en general.",
  I01: "Construcciones.",
  I02: "Mobiliario y equipo de oficina por inversiones.",
  I03: "Equipo de transporte.",
  I04: "Equipo de computo y accesorios.",
  I05: "Dados, troqueles, moldes, matrices y herramental.",
  I06: "Comunicaciones telefónicas.",
  I07: "Comunicaciones satelitales.",
  I08: "Otra maquinaria y equipo.",
  D01: "Honorarios médicos, dentales y gastos hospitalarios.",
  D02: "Gastos médicos por incapacidad o discapacidad.",
  D03: "Gastos funerales.",
  D04: "Donativos.",
  D05: "Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).",
  D06: "Aportaciones voluntarias al SAR.",
  D07: "Primas por seguros de gastos médicos.",
  D08: "Gastos de transportación escolar obligatoria.",
  D09: "Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.",
  D10: "Pagos por servicios educativos (colegiaturas).",
  S01: "Sin efectos fiscales.",
  CP01: "Pagos",
  CN01: "Nómina",
  P01: "Por definir",
};

export const TIPO_COMPROBANTE: Record<string, string> = {
  I: "Ingreso",
  E: "Egreso",
  T: "Traslado",
  N: "Nómina",
  P: "Pago",
};

export const EXPORTACION: Record<string, string> = {
  "01": "No aplica",
  "02": "Definitiva con clave A1",
  "03": "Temporal",
  "04": "Definitiva con clave distinta a A1 o cuando no existe enajenación en términos del CFF",
};

export const OBJETO_IMP: Record<string, string> = {
  "01": "No objeto de impuesto.",
  "02": "Sí objeto de impuesto.",
  "03": "Sí objeto del impuesto y no obligado al desglose.",
  "04": "Sí objeto del impuesto y no causa impuesto.",
  "05": "Sí objeto del impuesto, IVA crédito PODEBI.",
  "06": "Sí objeto del IVA, No traslado IVA.",
  "07": "No traslado del IVA, Sí desglose IEPS.",
  "08": "No traslado del IVA, No desglose IEPS.",
};

export const FORMA_PAGO: Record<string, string> = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electrónica de fondos (incluye SPEI)",
  "04": "Tarjeta de crédito",
  "05": "Monedero electrónico",
  "06": "Dinero electrónico",
  "08": "Vales de despensa",
  "12": "Dación en pago",
  "13": "Pago por subrogación",
  "14": "Pago por consignación",
  "15": "Condonación",
  "17": "Compensación",
  "23": "Novación",
  "24": "Confusión",
  "25": "Remisión de deuda",
  "26": "Prescripción o caducidad",
  "27": "A satisfacción del acreedor",
  "28": "Tarjeta de débito",
  "29": "Tarjeta de servicios",
  "30": "Aplicación de anticipos",
  "31": "Intermediario pagos",
  "99": "Por definir",
};

export const METODO_PAGO: Record<string, string> = {
  PUE: "Pago en una sola exhibición",
  PPD: "Pago en parcialidades o diferido",
};

export const MONEDA: Record<string, string> = {
  MXN: "Peso Mexicano",
  USD: "Dolar americano",
  EUR: "Euro",
  CAD: "Dolar Canadiense",
  GBP: "Libra Esterlina",
  JPY: "Yen",
  CNY: "Yuan Renminbi",
  XXX: "Los códigos asignados para las transacciones en que intervenga ninguna moneda",
};

export const IMPUESTO: Record<string, string> = {
  "001": "ISR",
  "002": "IVA",
  "003": "IEPS",
};

export const TIPO_RELACION: Record<string, string> = {
  "01": "Nota de crédito de los documentos relacionados",
  "02": "Nota de débito de los documentos relacionados",
  "03": "Devolución de mercancía sobre facturas o traslados previos",
  "04": "Sustitución de los CFDI previos",
  "05": "Traslados de mercancías facturados previamente",
  "06": "Factura generada por los traslados previos",
  "07": "CFDI por aplicación de anticipo",
};

export const PERIODICIDAD: Record<string, string> = {
  "01": "Diario",
  "02": "Semanal",
  "03": "Quincenal",
  "04": "Mensual",
  "05": "Bimestral",
};

export const MESES: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
  "13": "Enero-Febrero",
  "14": "Marzo-Abril",
  "15": "Mayo-Junio",
  "16": "Julio-Agosto",
  "17": "Septiembre-Octubre",
  "18": "Noviembre-Diciembre",
};

// Claves de unidad frecuentes, para cuando el CFDI no trae el atributo Unidad.
export const CLAVE_UNIDAD: Record<string, string> = {
  H87: "Pieza",
  E48: "Unidad de servicio",
  ACT: "Actividad",
  KGM: "Kilogramo",
  GRM: "Gramo",
  TNE: "Tonelada",
  LTR: "Litro",
  MLT: "Mililitro",
  MTR: "Metro",
  MTK: "Metro cuadrado",
  MTQ: "Metro cúbico",
  XUN: "Unidad",
  C62: "Uno",
  EA: "Elemento",
  E51: "Trabajo",
  HUR: "Hora",
  DAY: "Día",
  MON: "Mes",
  ANN: "Año",
  A9: "Tarifa",
  XBX: "Caja",
  XPK: "Paquete",
  KT: "Kit",
  SET: "Conjunto",
  LO: "Lote",
  KWH: "Kilowatt hora",
  ZZ: "Mutuamente definido",
};

export const TIPO_NOMINA: Record<string, string> = {
  O: "Nómina ordinaria",
  E: "Nómina extraordinaria",
};

export const PERIODICIDAD_PAGO: Record<string, string> = {
  "01": "Diario",
  "02": "Semanal",
  "03": "Catorcenal",
  "04": "Quincenal",
  "05": "Mensual",
  "06": "Bimestral",
  "07": "Unidad obra",
  "08": "Comisión",
  "09": "Precio alzado",
  "10": "Decenal",
  "99": "Otra Periodicidad",
};

export const regimenFiscal = lookup(REGIMEN_FISCAL);
export const usoCfdi = lookup(USO_CFDI);
export const tipoComprobante = lookup(TIPO_COMPROBANTE);
export const exportacion = lookup(EXPORTACION);
export const objetoImp = lookup(OBJETO_IMP);
export const formaPago = lookup(FORMA_PAGO);
export const metodoPago = lookup(METODO_PAGO);
export const moneda = lookup(MONEDA);
export const impuesto = lookup(IMPUESTO);
export const tipoRelacion = lookup(TIPO_RELACION);
export const periodicidad = lookup(PERIODICIDAD);
export const mes = lookup(MESES);
export const claveUnidad = lookup(CLAVE_UNIDAD);
export const tipoNomina = lookup(TIPO_NOMINA);
export const periodicidadPago = lookup(PERIODICIDAD_PAGO);
