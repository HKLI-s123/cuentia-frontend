// app/services/botService.ts
import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

export type WhatsappBotStatus = {
  hasPhone: boolean;
  phone: string | null;
  canChangeToday: boolean;
  canRemoveToday: boolean;
  userPhone: string | null;
};

// Obtener estado de ambos bots
export async function getBotStatus() {
  const res = await apiFetch(`${API_URL}/whatsapp/config`);
  return res?.json();
}

export const getWhatsappBotStatus = async (): Promise<WhatsappBotStatus> => {
  const res = await apiFetch(`${API_URL}/whatsapp/cuentia-bot`, {
    method: "GET",
  });

  if (!res?.ok) {
    throw new Error("Error obteniendo estado del bot");
  }

  return res.json();
};

export const setWhatsappBotPhone = async (telefono: string) => {
  const res = await apiFetch(`${API_URL}/whatsapp/cuentia-bot`, {
    method: "POST",
    body: JSON.stringify({ telefono }),
  });

  if (!res?.ok) {
    const err = await res?.json();
    throw new Error(err.message || "Error al guardar número");
  }

  return res.json();
};

export const removeWhatsappBotPhone = async () => {
  const res = await apiFetch(`${API_URL}/whatsapp/cuentia-bot`, {
    method: "DELETE",
  });

  if (!res?.ok) {
    const err = await res?.json();
    throw new Error(err.message || "Error al quitar número");
  }

  return res.json();
};