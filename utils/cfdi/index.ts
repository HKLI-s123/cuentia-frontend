import { saveAs } from "file-saver";
import { getCfdiXml, exportarXmlsZip, MAX_XML_POR_ZIP } from "@/app/services/financeService";
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

/**
 * Descarga en ZIP los XML originales de una o varias facturas. Si son más de
 * MAX_XML_POR_ZIP se piden en partes (un ZIP por parte). Devuelve cuántos XML
 * se exportaron y cuántos no se encontraron.
 */
export async function descargarXmlsZip(opts: {
  uuids: string[];
  rfc?: string;
  nombre: string; // nombre del ZIP, sin extensión
}): Promise<{ exportados: number; faltantes: number }> {
  const uuids = Array.from(
    new Set(opts.uuids.map((u) => String(u ?? "").trim().toUpperCase()).filter(Boolean))
  );

  const partes: string[][] = [];
  for (let i = 0; i < uuids.length; i += MAX_XML_POR_ZIP) {
    partes.push(uuids.slice(i, i + MAX_XML_POR_ZIP));
  }

  let exportados = 0;
  let faltantes = 0;
  for (let i = 0; i < partes.length; i++) {
    const zip = await exportarXmlsZip(partes[i], opts.rfc);
    if (!zip) {
      faltantes += partes[i].length;
      continue;
    }
    saveAs(zip.blob, partes.length > 1 ? `${opts.nombre}_parte${i + 1}.zip` : `${opts.nombre}.zip`);
    exportados += partes[i].length - zip.faltantes;
    faltantes += zip.faltantes;
  }
  return { exportados, faltantes };
}
