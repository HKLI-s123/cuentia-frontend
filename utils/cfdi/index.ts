import { saveAs } from "file-saver";
import JSZip from "jszip";
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

// Los PDF se arman en el navegador: se descargan en partes para no llenar la memoria
export const MAX_PDF_POR_ZIP = 500;

/**
 * Descarga en ZIP la representación impresa (estilo SAT) de varias facturas,
 * un PDF por factura. Los XML se piden en un solo ZIP al backend; las que no
 * lo tengan se arman con los datos registrados (`fallback`), sin sellos.
 * Si son más de MAX_PDF_POR_ZIP se descarga un ZIP por parte.
 */
export async function descargarPdfsZip(opts: {
  uuids: string[];
  rfc?: string;
  nombre: string; // nombre del ZIP, sin extensión
  fallback: (uuid: string) => CfdiPdfData | null;
  onProgress?: (hechos: number, total: number) => void;
}): Promise<{ exportados: number; sinXml: number; fallidos: number }> {
  const uuids = Array.from(
    new Set(opts.uuids.map((u) => String(u ?? "").trim().toUpperCase()).filter(Boolean))
  );

  const partes: string[][] = [];
  for (let i = 0; i < uuids.length; i += MAX_PDF_POR_ZIP) {
    partes.push(uuids.slice(i, i + MAX_PDF_POR_ZIP));
  }

  let exportados = 0;
  let sinXml = 0;
  let fallidos = 0;
  let hechos = 0;
  for (let i = 0; i < partes.length; i++) {
    const xmls = await xmlsPorUuid(partes[i], opts.rfc);
    const zip = new JSZip();
    let enParte = 0;

    for (const uuid of partes[i]) {
      try {
        let data: CfdiPdfData | null = null;
        const xml = xmls.get(uuid);
        if (xml) {
          try {
            data = parseCfdiXml(xml);
          } catch (err) {
            console.warn(`XML ilegible de ${uuid}, se usan datos de BD:`, err);
          }
        }
        if (!data) data = opts.fallback(uuid);

        if (data) {
          const doc = await renderCfdiPdf(data);
          zip.file(`${uuid}.pdf`, doc.output("arraybuffer"));
          enParte++;
          if (data.fuente === "db") sinXml++;
        } else {
          fallidos++;
        }
      } catch (err) {
        console.error(`No se pudo generar el PDF de ${uuid}:`, err);
        fallidos++;
      }
      opts.onProgress?.(++hechos, uuids.length);
    }

    if (enParte === 0) continue;
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, partes.length > 1 ? `${opts.nombre}_parte${i + 1}.zip` : `${opts.nombre}.zip`);
    exportados += enParte;
  }
  return { exportados, sinXml, fallidos };
}

/** XML originales de los UUID indicados (Map<UUID, xml>), vía el ZIP del backend. */
async function xmlsPorUuid(uuids: string[], rfc?: string): Promise<Map<string, string>> {
  const xmls = new Map<string, string>();
  try {
    const res = await exportarXmlsZip(uuids, rfc);
    if (!res) return xmls;
    const zip = await JSZip.loadAsync(res.blob);
    for (const archivo of Object.values(zip.files)) {
      if (archivo.dir || !/\.xml$/i.test(archivo.name)) continue;
      const uuid = archivo.name.replace(/^.*\//, "").slice(0, -4).toUpperCase();
      xmls.set(uuid, await archivo.async("string"));
    }
  } catch (err) {
    console.warn("No se pudieron obtener los XML, se usan datos de BD:", err);
  }
  return xmls;
}
