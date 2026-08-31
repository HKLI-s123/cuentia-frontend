import { API_URL } from "@/utils/env";
import { apiFetch } from "./apiClient";

// frontend/services/clientes.ts
export type ClienteDto = {
  id: number;
  nombre: string;
  rfc: string;
  fiel: string;
  ciec: string;
  cer_path: string;
  key_path: string;
};


export const getClientes = async (): Promise<ClienteDto[]> => {
  const res = await apiFetch(`${API_URL}/clientes`);
  if (!res?.ok) throw new Error("Error al obtener clientes");
  return res.json();
};

/**
 * Extrae el mensaje de error real que devuelve el backend (NestJS responde
 * `{ statusCode, message, error }`). `message` puede ser string o string[].
 * Así el usuario ve el motivo concreto (FIEL incorrecta, RFC duplicado, etc.)
 * en lugar de un texto genérico.
 */
// Mensajes técnicos del backend que conviene traducir a algo entendible.
const FRIENDLY_ERRORS: Record<string, string> = {
  "Forbidden resource": "No tienes permisos para dar de alta clientes.",
  "Internal server error": "Ocurrió un error en el servidor. Intenta de nuevo.",
};

async function extractApiError(res: Response | undefined, fallback: string): Promise<string> {
  if (!res) return fallback;
  // 429: demasiadas solicitudes (rate limit) — el body trae el detalle.
  try {
    const data = await res.json();
    let msg = data?.message ?? data?.error;
    if (Array.isArray(msg)) msg = msg.join(" ");
    if (typeof msg === "string" && msg.trim()) {
      return FRIENDLY_ERRORS[msg.trim()] ?? msg;
    }
  } catch {
    /* respuesta sin JSON */
  }
  return fallback;
}

export const createCliente = async (formData: FormData): Promise<ClienteDto> => {
  const res = await apiFetch(`${API_URL}/clientes`, {
    method: "POST",
    body: formData,
  });
  if (!res?.ok) throw new Error(await extractApiError(res, "No se pudo crear el cliente."));
  return res.json() as Promise<ClienteDto>;
};

export const updateCliente = async (id: number, formData: FormData): Promise<ClienteDto> => {
  const res = await apiFetch(`${API_URL}/clientes/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (!res?.ok) throw new Error(await extractApiError(res, "No se pudo actualizar el cliente."));
  return res.json() as Promise<ClienteDto>;
};

export const deleteCliente = async (id: number): Promise<void> => {
  const res = await apiFetch(`${API_URL}/clientes/${id}`, { method: "DELETE" });
  if (!res?.ok) throw new Error("Error al eliminar cliente");
};

export async function pauseSync(rfc: string) {
  return apiFetch(`${API_URL}/clientes/${rfc}/pause-sync`, {
    method: "PATCH",
  }).then((r) => r?.json());
}

export async function resumeSync(rfc: string) {
  return apiFetch(`${API_URL}/clientes/${rfc}/resume-sync`, {
    method: "PATCH",
  }).then((r) => r?.json());
}


export async function toggleSync() {
  const res = await apiFetch(`${API_URL}/clientes/sync/toggle`, {
    method: "PATCH",
  });

  if (!res?.ok) {
    throw new Error("Error al cambiar el estado de sincronización");
  }

  return res.json(); // ⬅ Regresa { syncPaused, syncStatus, message }
}


