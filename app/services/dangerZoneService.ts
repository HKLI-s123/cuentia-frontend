import { API_URL } from "@/utils/env";
import { apiFetch } from "./apiClient";

export async function cancelSubscription() {
  const res = await apiFetch(`${API_URL}/danger-zone/cancel-subscription`, {
    method: "POST",
  });
  return res?.json();
}

export async function deleteAccount(password?: string) {
  const res = await apiFetch(`${API_URL}/danger-zone/delete-account`, {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  return res?.json();
}
