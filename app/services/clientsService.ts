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

const API_URL = "http://localhost:3001/clientes"; // Ajusta si es necesario

export const getClientes = async (): Promise<ClienteDto[]> => {
  const res = await apiFetch(API_URL);
  if (!res?.ok) throw new Error("Error al obtener clientes");
  return res.json();
};

export const createCliente = async (formData: FormData): Promise<ClienteDto> => {
  const res = await apiFetch(API_URL, {
    method: "POST",
    body: formData,
  });
  if (!res?.ok) throw new Error("Error al crear cliente, ya existe o se alcanzo el limite del plan actual");
  return res.json() as Promise<ClienteDto>;
};

export const updateCliente = async (id: number, formData: FormData): Promise<ClienteDto> => {
  const res = await apiFetch(`${API_URL}/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (!res?.ok) throw new Error("Error al actualizar cliente");
  return res.json() as Promise<ClienteDto>;
};

export const deleteCliente = async (id: number): Promise<void> => {
  const res = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res?.ok) throw new Error("Error al eliminar cliente");
};

export async function pauseSync(rfc: string) {
  return apiFetch(`http://localhost:3001/clientes/${rfc}/pause-sync`, {
    method: "PATCH",
  }).then((r) => r?.json());
}

export async function resumeSync(rfc: string) {
  return apiFetch(`http://localhost:3001/clientes/${rfc}/resume-sync`, {
    method: "PATCH",
  }).then((r) => r?.json());
}


export async function toggleSync() {
  const res = await apiFetch("http://localhost:3001/clientes/sync/toggle", {
    method: "PATCH",
  });

  if (!res?.ok) {
    throw new Error("Error al cambiar el estado de sincronización");
  }

  return res.json(); // ⬅ Regresa { syncPaused, syncStatus, message }
}


