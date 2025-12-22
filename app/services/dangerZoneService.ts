import { apiFetch } from "./apiClient";

export async function cancelSubscription() {
  const res = await apiFetch("http://localhost:3001/danger-zone/cancel-subscription", {
    method: "POST",
  });
  return res?.json();
}

export async function deleteAccount(password?: string) {
  const res = await apiFetch("http://localhost:3001/danger-zone/delete-account", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  return res?.json();
}
