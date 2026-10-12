import { getCfdiXml } from "@/app/services/financeService";
import { parseCfdiXml } from "./parseCfdiXml";
import { renderCfdiPdf } from "./renderCfdiPdf";
import type { CfdiPdfData } from "./types";

export { facturaFromDb, complementoFromDb } from "./fromDb";
export type { CfdiPdfData } from "./types";

/**
 * Descarga la representación impresa (estilo SAT) de un CFDI.
 * Usa el XML original si el backend lo tiene; si no, arma el PDF con los datos
 * registrados en BD (`fallback`), sin sellos. Devuelve la fuente usada.
 */
export async function descargarCfdiPdf(opts: {
  uuid: string;
  rfc?: string;
  fallback: () => CfdiPdfData;
}): Promise<{ fuente: "xml" | "db" }> {
  let data: CfdiPdfData | null = null;

  try {
    const xml = await getCfdiXml(opts.uuid, opts.rfc);
    if (xml) data = parseCfdiXml(xml);
  } catch (err) {
    console.warn("No se pudo usar el XML del CFDI, se usan datos de BD:", err);
  }

  if (!data) data = opts.fallback();

  const doc = await renderCfdiPdf(data);
  doc.save(`${data.uuid || opts.uuid}.pdf`);
  return { fuente: data.fuente };
}
