// app/services/botService.ts
import { apiFetch } from "@/app/services/apiClient";

// Obtener estado de ambos bots
export async function getBotStatus() {
  const res = await apiFetch("http://localhost:3001/whatsapp/config");
  return res?.json();
}