import { API_URL } from "@/utils/env";
import { apiFetch } from "./apiClient";

export const sendChatMessage = async ({
  message,
  rfc,
  semanas,
}: {
  message: string;
  rfc: string;
  semanas: { id: string; label: string; cantidad: number }[];
}) => {
  try {
    const response = await apiFetch(`${API_URL}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, rfc, semanas }),
    });

    if (!response?.ok) throw new Error("Error en la respuesta del servidor");

    const data = await response.json();
    
    return data; // <--- NO solo reply
  } catch (error) {
    console.error("❌ Error en sendChatMessage:", error);
    return { reply: "Hubo un error al procesar tu solicitud, verifica el limite de mensajes de tu cuenta.", raw: null };
  }
};


export async function validateGuestKey(key: string): Promise<{ rfc: string } | null> {
  try {
    const res = await apiFetch(`${API_URL}/guest/validate`, {
      method: "POST",
      body: JSON.stringify({ key }),
    });

    if (!res?.ok) {
      return null; // backend regresa 401/429 cuando no existe o está bloqueada
    }

    const data = await res.json(); // { rfc: string }
    return data;
  } catch (err) {
    console.error("validateGuestKey error:", err);
    return null;
  }
}

export async function activateGuest(rfc: string) {
  const res = await apiFetch(`${API_URL}/guest/activate`, {
    method: "POST",
    body: JSON.stringify({ rfc }),
  });

  if (!res?.ok) throw new Error("Error al activar guestMode");
  return await res.json(); // { success: true }
}
