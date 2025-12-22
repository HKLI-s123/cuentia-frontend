import { API_URL } from "@/utils/env";
import { apiFetch, publicApiFetch } from "./apiClient";

export async function registerUser(data: any) {
  if (!grecaptcha) throw new Error("Captcha no cargado");
  // 1. Obtener token del reCAPTCHA v3
  const recaptchaToken = await grecaptcha.execute(
    process.env.NEXT_PUBLIC_RECAPTCHA_KEY!,
    { action: "register" }
  );

  console.log("TOKEN ENVIADO:", recaptchaToken);

  // 2. Preparar payload JSON
  const payload = {
    ...data,
    recaptchaToken,
  };

  // 3. POST al backend con JSON, NO FormData
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include", // ← IMPORTANTE para que el refresh token HttpOnly llegue
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Error en el registro");
  }

  return json;
}

export async function loginUser(emailOrUser: string, password: string) {
  // 1. Obtener token del reCAPTCHA
  const recaptchaToken = await grecaptcha.execute(
    process.env.NEXT_PUBLIC_RECAPTCHA_KEY!,
    { action: "login" }
  );

  // 2. Enviar al backend
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include", // para refresh cookies si las agregas luego
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUser,
      password,
      recaptchaToken,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Error al iniciar sesión");
  }

  return json; // contiene { accessToken, refreshToken, user }
}

export async function fetchMe() {
  // Si NO hay access token en memoria, intentamos refrescarlo
  if (!window.__accessToken) {
    const newAccess = await refreshAccessToken();
    if (!newAccess) return null; // Ni refrescando -> no hay sesión
  }

  // Hacemos la llamada protegida
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${window.__accessToken}`,
    },
  });

  if (!res.ok) return null;

  return await res.json();
}

export async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // para enviar cookie refresh_token
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Guardamos el nuevo accessToken en memoria segura
    window.__accessToken = data.accessToken;

    return data.accessToken;
  } catch {
    return null;
  }
}

export async function secureResendVerification() {
  let res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.__accessToken}`,
    },
  });

  // Si expira el access token → intentamos refrescarlo
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return { message: "Sesión expirada. Inicia sesión de nuevo." };

    res = await fetch(`${API_URL}/auth/resend-verification`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.__accessToken}`,
      },
    });
  }

  return await res.json();
}

export async function logoutUser() {
  try {
    const access = localStorage.getItem("accessToken");

    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });

    // Limpia access token local SIEMPRE
    localStorage.removeItem("accessToken");
    window.__accessToken = undefined;

    return res.ok;
  } catch {
    // En caso de desconexión de servidor, cerrar sesión igual
    localStorage.removeItem("accessToken");
    window.__accessToken = undefined;
    return false;
  }
}

export async function requestPasswordReset(email: string) {
  const recaptchaToken = await grecaptcha.execute(
    process.env.NEXT_PUBLIC_RECAPTCHA_KEY!,
    { action: "password_reset_request" }
  );

  const res = await fetch(`${API_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, recaptchaToken }),
  });

  return res.json(); // backend nunca revela si el email existe
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  const json = await res.json();

  if (!res.ok) throw new Error(json.message || "No se pudo restablecer la contraseña");

  return json;
}

export async function getSessionInfo() {
  try {
    const res = await apiFetch(`${API_URL}/auth/session-info`);

    if (!res || !res.ok) {
      throw new Error("No se pudo obtener la información de sesión");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en getSessionInfo:", error);
    throw error;
  }
}

export async function getSessionOptional() {
  const res = await publicApiFetch(`${API_URL}/auth/session-info`);

  if (!res || !res.ok) return null;
  return res.json();
}


export async function googleLogin(googleToken: string) {
  try {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",   // <= FALTABA ESTO
      body: JSON.stringify({ token: googleToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error en Google Login");
    }

    return data; // { accessToken }
  } catch (error: any) {
    throw new Error(error.message || "Error procesando Google Login");
  }
}


export async function googleSetupAccount(tipo_cuenta: string, empresa: string | null, accepted: boolean) {
  const res = await apiFetch(`${API_URL}/auth/google/setup`, {
    method: "POST",
    body: JSON.stringify({
      tipo_cuenta,
      empresa,
      accepted,
    }),
  });

  if (!res?.ok) {
    const data = await res?.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo guardar el tipo de cuenta");
  }

  return await res.json();
}






