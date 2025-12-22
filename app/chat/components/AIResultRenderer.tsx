"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AIResultRendererProps {
  data: any;
}

const SECTION_TITLES = [
  "Assumptions",
  "Hypotheses",
  "Niche Hypotheses",
  "Competitors",
  "Competitors By Hypothesis",
  "Next Steps",
  "Note",
  "Action If Confirmed",
  "Needed Details",
  "Country",
  "Hypothesis",
  "Label",
  "Name",
  "Website",
  "Channels",
  "Scope",
];

// 🔹 Detección de palabras clave financieras
const FINANCIAL_KEYWORDS = [
  "ingresos",
  "egresos",
  "iva",
  "total",
  "utilidad",
  "gasto",
  "pago",
  "factura",
  "balance",
];

// 🔹 Formateador de claves
const formatKey = (key: string) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

// 🔹 Detecta si un objeto parece ser competidor
const isCompetitorItem = (obj: any) => {
  if (typeof obj !== "object" || !obj) return false;
  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  return (
    keys.includes("name") &&
    (keys.includes("website") ||
      keys.includes("channels") ||
      keys.includes("scope"))
  );
};

// 🔹 Detecta si un array es de datos financieros (numéricos por mes o categoría)
const isFinancialDataset = (arr: any[]): boolean => {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.every(
    (item) =>
      typeof item === "object" &&
      Object.values(item).some((v) => typeof v === "number")
  );
};

export const AIResultRenderer: React.FC<AIResultRendererProps> = ({ data }) => {
  if (!data) return null;

  const renderValue = (value: any): React.ReactNode => {
    if (value === null) return <span className="text-gray-400">null</span>;

    if (typeof value === "string" || typeof value === "number") {
      if (typeof value === "string" && value.startsWith("http")) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline break-words"
          >
            {value}
          </a>
        );
      }
      return <span className="whitespace-pre-wrap">{String(value)}</span>;
    }

    if (Array.isArray(value)) {
      // 📊 Si todos los elementos son competidores → render cards
      if (value.every(isCompetitorItem)) {
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {value.map((v, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="font-semibold text-indigo-500">
                  {v.Name || v.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {v.Website || v.website ? (
                    <a
                      href={v.Website || v.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {v.Website || v.website}
                    </a>
                  ) : null}
                </div>
                <div className="mt-2 text-xs space-y-1">
                  {v.Channels || v.channels ? (
                    <div>
                      <b className="text-blue-400">Canales:</b>{" "}
                      {v.Channels || v.channels}
                    </div>
                  ) : null}
                  {v.Scope || v.scope ? (
                    <div>
                      <b className="text-blue-400">Alcance:</b>{" "}
                      {v.Scope || v.scope}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        );
      }

      // 📈 Si parece dataset financiero → render gráfico
      if (isFinancialDataset(value)) {
        const numericKeys = Object.keys(value[0]).filter((k) =>
          value.some((v) => typeof v[k] === "number")
        );
        const xKey =
          Object.keys(value[0]).find(
            (k) => typeof value[0][k] === "string"
          ) || "label";

        return (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={value}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                {numericKeys.map((k) => (
                  <Bar key={k} dataKey={k} fill="#6366f1" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      // 🔹 En otros casos → lista normal
      return (
        <ul className="ml-4 list-disc space-y-1">
          {value.map((v, i) => (
            <li key={i}>{renderValue(v)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="ml-4 space-y-3 border-l pl-3 border-gray-300 dark:border-gray-700">
          {Object.entries(value).map(([key, val]) => {
            const formattedKey = formatKey(key);
            const isSectionTitle = SECTION_TITLES.includes(formattedKey);
            const isFinancial = FINANCIAL_KEYWORDS.some((w) =>
              key.toLowerCase().includes(w)
            );

            return (
              <div key={key} className="space-y-1">
                <div
                  className={`${
                    isSectionTitle || isFinancial
                      ? "text-lg font-semibold text-indigo-500 mt-4"
                      : "font-medium text-blue-400"
                  }`}
                >
                  {formattedKey}:
                </div>
                <div className="ml-2">{renderValue(val)}</div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mt-4 p-4 rounded-lg bg-gray-50 text-gray-900 text-sm dark:bg-gray-800 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-700">
      {renderValue(data)}
    </div>
  );
};
