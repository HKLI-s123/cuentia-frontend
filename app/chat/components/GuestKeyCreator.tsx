"use client";

import { apiFetch } from "@/app/services/apiClient";
import React, { useState } from "react";
import { toast } from "sonner"

type GeneratedKey = {
  rfc: string;
  key: string;
  error?: string | null;
};

type GuestKeyCreatorProps = {
  // lista de RFCs que el usuario multicuenta puede seleccionar
  availableRfcs: { rfc: string; nombre: string }[]
  // si tu app pasa token automáticamente, no hace falta; si no, pásalo aquí
  authToken?: string | null;
};

export const GuestKeyCreator: React.FC<GuestKeyCreatorProps> = ({
  availableRfcs,
  authToken = null,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedKey[]>([]);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggle = (rfc: string) =>
    setSelected((s) => (s.includes(rfc) ? s.filter((x) => x !== rfc) : [...s, rfc]));

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Clave copiada al portapapeles");
    } catch {
      toast.error("No se pudo copiar. Selecciona y copia manualmente.");
    }
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const csv = ["rfc,key", ...results.map((r) => `${r.rfc},${r.key}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guest-keys-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Genera keys secuencialmente para evitar picos en el backend
  const handleGenerate = async () => {
    if (selected.length === 0) {
      toast.warning("Selecciona al menos un RFC");
      return;
    }

    setGenerating(true);
    setResults([]);
    setErrorGlobal(null);

    const acc: GeneratedKey[] = [];

    for (const rfc of selected) {
      try {
        // Ajusta la URL si tu API está montada en subpath o CORS
        const res = await apiFetch("http://localhost:3001/guest/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ rfc }),
        });

        if (!res?.ok) {
          const body = await res?.text().catch(() => null);
          acc.push({ rfc, key: "", error: `Error ${res?.status}: ${body ?? res?.statusText}` });
          continue;
        }

        const data = await res.json(); // espera { key: "rawKey", rfc: "..." }
        if (!data || !data.key) {
          acc.push({ rfc, key: "", error: "Respuesta inválida del servidor" });
          continue;
        }

        acc.push({ rfc, key: data.key, error: null });
      } catch (err: any) {
        acc.push({ rfc, key: "", error: err?.message ?? "Error de red" });
      }
    }

    setResults(acc);
    setGenerating(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Generador de claves de invitado</h3>

      <p className="text-sm text-gray-600 mb-4">
        Selecciona los RFCs para los cuales quieras generar una clave de invitado. Cada clave
        pertenece a un RFC y se debe guardar con seguridad.
      </p>
       {/* Buscador */}
       <input
         type="text"
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         placeholder="Buscar por nombre o RFC..."
         className="w-full mb-3 p-2 border rounded-md shadow-sm text-sm"
       />
       
       {/* Lista scrollable */}
       <div className="max-h-64 overflow-y-auto border rounded-md p-2 bg-gray-50">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
           {availableRfcs
             .filter((c) => {
               const term = search.toLowerCase();
               return (
                 c.rfc.toLowerCase().includes(term) ||
                 c.nombre.toLowerCase().includes(term)
               );
             })
             .map((c) => (
               <label
                 key={c.rfc}
                 className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer ${
                   selected.includes(c.rfc) ? "bg-gray-100" : "bg-white"
                 }`}
               >
                 <input
                   type="checkbox"
                   checked={selected.includes(c.rfc)}
                   onChange={() => toggle(c.rfc)}
                 />
                 <div className="flex flex-col">
                   <span className="font-semibold text-sm truncate">{c.nombre}</span>
                   <span className="font-mono text-xs text-gray-600 truncate">{c.rfc}</span>
                 </div>
               </label>
             ))}
         </div>
       
         {/* Cuando no hay resultados */}
         {availableRfcs.filter((c) =>
           `${c.nombre} ${c.rfc}`.toLowerCase().includes(search.toLowerCase())
         ).length === 0 && (
           <p className="text-center text-sm text-gray-500 py-4">
             Sin resultados para "{search}"
           </p>
         )}
       </div>
       <br/>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGenerate}
          disabled={generating || selected.length === 0}
          className={`px-4 py-2 rounded-md text-white ${
            generating || selected.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
          }`}
        >
          {generating ? "Generando..." : `Generar ${selected.length} clave(s)`}
        </button>

        <button
          onClick={() => {
            setSelected([]);
            setResults([]);
            setErrorGlobal(null);
          }}
          className="px-3 py-2 rounded-md border"
        >
          Limpiar
        </button>

        <button
          onClick={downloadCSV}
          disabled={results.length === 0}
          className="px-3 py-2 rounded-md border ml-auto"
        >
          Descargar CSV
        </button>
      </div>

      <div>
        {results.length === 0 ? (
          <div className="text-sm text-gray-500">No hay claves generadas todavía.</div>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.rfc} className="p-2 border rounded-md flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.rfc}</div>
                  {r.error ? (
                    <div className="text-xs text-red-600">{r.error}</div>
                  ) : (
                    <div className="text-xs text-gray-700 font-mono">{r.key}</div>
                  )}
                </div>

                {!r.error && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(r.key)}
                      className="px-2 py-1 rounded-md border text-sm"
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {errorGlobal && <div className="mt-3 text-sm text-red-600">{errorGlobal}</div>}
    </div>
  );
};
