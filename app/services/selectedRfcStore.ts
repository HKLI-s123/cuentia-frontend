// Persiste el RFC/cliente seleccionado para que se mantenga entre las distintas
// secciones (CFDIs, Notas de Crédito, Pagos, DIOT), que son rutas independientes
// y de otro modo reiniciarían la selección en cada navegación.

const KEY = "cuentia:selectedRFC";

export function setStoredRFC(rfc: string | null) {
  if (typeof window === "undefined") return;
  if (rfc) localStorage.setItem(KEY, rfc);
  else localStorage.removeItem(KEY);
}

export function getStoredRFC(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

// Resuelve el RFC efectivo a usar: prioriza el guardado si sigue siendo válido
// para la sesión actual; si no, cae al RFC por defecto calculado por la vista.
export function resolveSelectedRFC(session: any, defaultRFC: string): string {
  const stored = getStoredRFC();
  if (!stored) return defaultRFC;

  const esValido =
    (session?.clientes ?? []).some((c: any) => c.rfc === stored) ||
    stored === session?.propioRFC ||
    stored === session?.guestRfc;

  return esValido ? stored : defaultRFC;
}
