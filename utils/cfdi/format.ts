// Formatos numéricos como los usa la representación impresa del SAT
// (separador de miles "," y punto decimal).

const toNum = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const hasValue = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== "";

export const fmtNum = (v: unknown, decimals = 2) =>
  toNum(v).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** "$ 1,221.00" */
export const fmtMoney = (v: unknown) => `$ ${fmtNum(v, 2)}`;

/** Importes de conceptos / impuestos: "1,221.000000" */
export const fmtImporte = (v: unknown) => (hasValue(v) ? fmtNum(v, 6) : "");

/** Tasa → "16.00%"; Cuota → valor tal cual; Exento → "" */
export const fmtTasa = (tipoFactor: string, v: unknown) => {
  if (!hasValue(v) || tipoFactor === "Exento") return "";
  if (tipoFactor === "Cuota") return String(v);
  return `${(toNum(v) * 100).toFixed(2)}%`;
};

/** "2026-01-07T10:34:37" → "2026-01-07 10:34:37" */
export const fmtFechaHora = (v: unknown) => String(v ?? "").trim().replace("T", " ");

/** Monto genérico con 2 decimales y signo de pesos, vacío si no hay valor. */
export const fmtMoneyOpt = (v: unknown) => (hasValue(v) ? fmtMoney(v) : "");

export const str = (v: unknown) => (hasValue(v) ? String(v).trim() : "");
