import { getAccessToken, setAccessToken } from "./tokenManager";

export async function apiFetch(url: string, options: any = {}) {
  const token = getAccessToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, { ...options, headers });

  // ---- Si el token expiró ----
  if (res.status === 401) {
    console.warn("Access token expirado. Intentando refresh...");

    const refreshRes = await fetch("http://localhost:3001/auth/refresh", {
      method: "POST",
      credentials: "include", // IMPORTANTE para cookies HttpOnly
    });

    if (!refreshRes.ok) {
      console.error("No se pudo refrescar sesión. Redirigiendo...");
      setAccessToken(null);
      window.location.href = "/login";
      return;
    }

    const data = await refreshRes.json();
    setAccessToken(data.accessToken);

    console.log("Token refrescado, repitiendo request...");

    // ---- Repetimos la petición original con el nuevo token ----
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${data.accessToken}`,
    };

    res = await fetch(url, { ...options, headers: retryHeaders });
  }

  return res;
}

export async function publicApiFetch(url: string, options: any = {}) {
  const token = getAccessToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, { ...options, headers });

  // 🔁 Intentar refresh, PERO sin redirect
  if (res.status === 401) {
    const refreshRes = await fetch(
      "http://localhost:3001/auth/refresh",
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!refreshRes.ok) {
      // ❌ No sesión → ok, seguimos como usuario anónimo
      return res;
    }

    const data = await refreshRes.json();
    setAccessToken(data.accessToken);

    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${data.accessToken}`,
    };

    res = await fetch(url, { ...options, headers: retryHeaders });
  }

  return res;
}
