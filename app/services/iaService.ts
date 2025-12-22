import { API_URL } from "@/utils/env";
import { Factura } from "../types/factura";
import { apiFetch } from "./apiClient";

export const analizarFacturaIA = async (factura: Factura, userId: number): Promise<string> => {
  try {
    const response = await apiFetch(`${API_URL}/cfdis/ia-factura`, {
      method: "POST",
      body: JSON.stringify({factura, userId}),
    });

    if (!response?.ok) {
      throw new Error(`Error ${response?.status}: ${response?.statusText}`);
    }

    // 🔹 Se asume que el backend responde con un JSON tipo:
    // { resultado: "texto del análisis IA..." }
    const data = await response.json();

    if (!data.resultado) {
      throw new Error("La respuesta del backend no contiene el campo 'resultado'.");
    }

    return data.resultado;
  } catch (error: any) {
    console.error("Error en analizarFacturaIA:", error);
    throw new Error("No fue posible generar el análisis con IA.");
  }
};
