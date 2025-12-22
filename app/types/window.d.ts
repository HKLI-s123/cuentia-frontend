// === Extensión de Window ===
declare global {
  interface Window {
    __accessToken?: string;  // token público temporal almacenado en memoria
  }
}

export {};