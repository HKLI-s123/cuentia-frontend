import { API_URL } from "@/utils/env";
import { apiFetch } from "./apiClient";

// Flag de lanzamiento: mientras sea false, la UI muestra "Próximamente".
export const FISCAL_DOCS_ENABLED =
  process.env.NEXT_PUBLIC_FISCAL_DOCS_ENABLED === "true";

// Precio del add-on (solo informativo para la UI; el cobro real lo hace Stripe).
export const FISCAL_DOCS_PRICE_MXN = 49;

const FISCAL_DOCS_LAUNCH_DATE =
  process.env.NEXT_PUBLIC_FISCAL_DOCS_LAUNCH_DATE || "";

/**
 * true si el usuario recibe documentos fiscales gratis (grandfathering):
 * registrado antes de la fecha de lanzamiento. Debe coincidir con la lógica
 * del backend (isFiscalDocsFree). Es solo para decidir si mostrar el aviso de
 * cobro; el cobro real siempre lo determina el backend.
 */
export function isFiscalDocsFree(createdAt?: string | null): boolean {
  if (!FISCAL_DOCS_LAUNCH_DATE || !createdAt) return false;
  const launch = new Date(FISCAL_DOCS_LAUNCH_DATE);
  if (isNaN(launch.getTime())) return false;
  return new Date(createdAt) < launch;
}

/** Activa/desactiva la descarga de documentos fiscales para un RFC. */
export async function toggleFiscalDocs(rfc: string, enabled: boolean) {
  const res = await apiFetch(`${API_URL}/clientes/${rfc}/fiscal-docs`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
  if (!res?.ok) throw new Error("Error al cambiar la descarga de documentos fiscales");
  return res.json();
}

/** Activa/desactiva la descarga de documentos fiscales para todos los RFCs. */
export async function toggleFiscalDocsAll(enabled: boolean) {
  const res = await apiFetch(`${API_URL}/clientes/fiscal-docs/all`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
  if (!res?.ok) throw new Error("Error al actualizar la descarga de documentos fiscales");
  return res.json();
}

async function downloadFiscalDoc(rfc: string, kind: "csf" | "opinion") {
  const res = await apiFetch(`${API_URL}/clientes/${rfc}/${kind}`);
  if (!res?.ok) {
    if (res?.status === 404) throw new Error("Documento aún no disponible");
    throw new Error("No se pudo descargar el documento");
  }

  const blob = await res.blob();
  const suffix = kind === "csf" ? "CONSTANCIA" : "OPINION";
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${rfc}_${suffix}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Descarga la Constancia de Situación Fiscal (CSF) de un RFC. */
export const downloadCsf = (rfc: string) => downloadFiscalDoc(rfc, "csf");

/** Descarga la Opinión de Cumplimiento de un RFC. */
export const downloadOpinion = (rfc: string) => downloadFiscalDoc(rfc, "opinion");
