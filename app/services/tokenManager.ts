let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;

  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
  }
}

export function getAccessToken() {
  if (accessToken) return accessToken;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("accessToken");
    if (stored) {
      accessToken = stored;
      return stored;
    }
  }

  return null;
}
