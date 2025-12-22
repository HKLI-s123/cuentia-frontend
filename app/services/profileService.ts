// app/services/profileService.ts

import { apiFetch } from "@/app/services/apiClient";
import { getAccessToken } from "./tokenManager";

/**
 * Actualiza el perfil del usuario, requiriendo contraseña
 */
export async function updateUserProfile(payload: {
  nombre?: string;
  telefono?: string | null;
  email?: string;
  passwordConfirm: string;
}) {
  const token = getAccessToken();
  if (!token) throw new Error("No hay token de acceso");

  const res = await apiFetch("http://localhost:3001/auth/update-profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res?.ok) {
    const data = await res?.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo actualizar el perfil");
  }

  return res.json();
}


/**
 * Cambiar contraseña del usuario (solo provider local)
 */
export async function changePassword(oldPassword: string, newPassword: string) {
  const token = getAccessToken();
  if (!token) throw new Error("No hay token de acceso");

  const res = await apiFetch("http://localhost:3001/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      oldPassword,
      newPassword,
    }),
  });

  if (!res?.ok) {
    const data = await res?.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo cambiar la contraseña");
  }

  return res.json();
}
