import { apiFetch } from "./apiClient";

export async function getNotificationPreferences() {
  const res = await apiFetch("http://localhost:3001/notifications");
  return res?.json();
}

export async function updateNotificationPreferences(prefs: any) {
  const res = await apiFetch("http://localhost:3001/notifications/update", {
    method: "PATCH",
    body: JSON.stringify(prefs),
  });
  return res?.json();
}

export async function getNotifications() {
  const res = await apiFetch("http://localhost:3001/notifications/my");

  if (!res?.ok) throw new Error("No se pudieron cargar las notificaciones");

  return res.json();
}

export async function deleteNotification(id: number) {
  const res = await apiFetch(`http://localhost:3001/notifications/${id}`, {
    method: "DELETE",
  });

  if (!res?.ok) throw new Error("Hubo un error al intentar eliminar tu notificacion");

  return res?.json();
}
