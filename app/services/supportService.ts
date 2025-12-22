import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

export type SupportCategory =
  | "Problema técnico"
  | "Facturación"
  | "Dudas generales"
  | "Reporte de CFDI"
  | "Sugerencia"
  | "Otro";

export type SupportRequest = {
  name: string;
  email: string;
  subject?: string;
  category?: SupportCategory;
  message: string;
};

export async function sendSupportRequest(payload: SupportRequest) {
  const res = await apiFetch(`${API_URL}/support`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res?.ok) {
    const errorText = await res?.text().catch(() => "");
    throw new Error(errorText || "Error al enviar la solicitud de soporte");
  }

  return res.json();
}
