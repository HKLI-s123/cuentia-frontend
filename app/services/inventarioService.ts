import { apiFetch } from "./apiClient";
import { API_URL } from "@/utils/env";

/** Módulo exclusivo "Inventario" (feature 'inventario' en user_features). */
export const INVENTARIO_FEATURE = "inventario";

export const INVENTARIO_ACCEPT = ".pdf,.xlsx,.xls";
export const INVENTARIO_MAX_FILE_MB = 20;
export const INVENTARIO_MAX_FILES = 10;

export type InventarioCliente = {
  id: number;
  nombre: string;
  rfc: string;
  archivos: number;
  ultimaCarga: string | null;
};

export type InventarioArchivo = {
  id: number;
  rfc: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByType: "user" | "employee";
  createdAt: string;
};

async function errorMessage(res: Response | undefined, fallback: string) {
  try {
    const data = await res?.json();
    const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
    return typeof msg === "string" && msg ? msg : fallback;
  } catch {
    return fallback;
  }
}

export async function getInventarioClientes(): Promise<InventarioCliente[]> {
  const res = await apiFetch(`${API_URL}/inventario/clientes`);
  if (!res?.ok) throw new Error(await errorMessage(res, "No se pudieron cargar los RFCs"));
  return res.json();
}

export async function getInventarioArchivos(rfc: string): Promise<InventarioArchivo[]> {
  const res = await apiFetch(`${API_URL}/inventario/archivos?rfc=${encodeURIComponent(rfc)}`);
  if (!res?.ok) throw new Error(await errorMessage(res, "No se pudieron cargar los archivos"));
  return res.json();
}

export async function uploadInventarioArchivos(rfc: string, files: File[]): Promise<InventarioArchivo[]> {
  const form = new FormData();
  form.append("rfc", rfc);
  files.forEach((f) => form.append("files", f));

  const res = await apiFetch(`${API_URL}/inventario/archivos`, { method: "POST", body: form });
  if (!res?.ok) throw new Error(await errorMessage(res, "No se pudieron subir los archivos"));
  return res.json();
}

export async function deleteInventarioArchivo(id: number): Promise<void> {
  const res = await apiFetch(`${API_URL}/inventario/archivos/${id}`, { method: "DELETE" });
  if (!res?.ok) throw new Error(await errorMessage(res, "No se pudo eliminar el archivo"));
}

export async function downloadInventarioArchivo(archivo: InventarioArchivo): Promise<void> {
  const res = await apiFetch(`${API_URL}/inventario/archivos/${archivo.id}/descargar`);
  if (!res?.ok) throw new Error(await errorMessage(res, "No se pudo descargar el archivo"));

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = archivo.originalName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
