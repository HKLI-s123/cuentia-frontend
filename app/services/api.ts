// services/api.ts
export function authHeaders() {
  const token = typeof window !== "undefined" ? window.__accessToken : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
