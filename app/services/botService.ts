// app/services/botService.ts
import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

// Obtener estado de ambos bots
export async function getBotStatus() {
  const res = await apiFetch(`${API_URL}/whatsapp/config`);
  return res?.json();
}