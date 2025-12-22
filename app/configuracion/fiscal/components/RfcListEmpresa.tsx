"use client";

import { useState, useMemo } from "react";
import { AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { pauseSync, resumeSync } from "@/app/services/clientsService";

// ⬅️ Tipo explícito para evitar errores TS
type ClienteAsociado = {
  rfc: string;
  nombre: string;
  syncStatus?: string | null;
  syncPaused?: boolean;
};

export default function RfcListEmpresa({ session }: any) {
  const [search, setSearch] = useState("");
  const [errorModal, setErrorModal] = useState<null | { rfc: string; nombre: string }>(null);

  // Filtrar “Yo”
  const clientesFiltrados = session.clientes.filter((c: any) => c.nombre !== "Yo");

  // Buscador (por RFC o nombre)
  const clientesVisibles = useMemo(() => {
    if (!search.trim()) return clientesFiltrados;

    return clientesFiltrados.filter((c: any) =>
      c.rfc.toLowerCase().includes(search.toLowerCase()) ||
      c.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, clientesFiltrados]);

    // ⬅️ Tipar correctamente el state para evitar el error!
  const [clientes, setClientes] = useState<ClienteAsociado[]>(
    () => session.clientes.filter((c: any) => c.nombre !== "Yo")
  );

  const toggleSync = async (cliente: ClienteAsociado) => {
    try {
      if (cliente.syncPaused) {
        await resumeSync(cliente.rfc);
        toast.success(`Descargas activadas para ${cliente.rfc}`);

        setClientes((prev: ClienteAsociado[]) =>
          prev.map((c: ClienteAsociado) =>
            c.rfc === cliente.rfc
              ? { ...c, syncPaused: false, syncStatus: "activo" }
              : c
          )
        );
      } else {
        await pauseSync(cliente.rfc);
        toast.success(`Descargas desactivadas para ${cliente.rfc}`);

        setClientes((prev: ClienteAsociado[]) =>
          prev.map((c: ClienteAsociado) =>
            c.rfc === cliente.rfc
              ? { ...c, syncPaused: true, syncStatus: "inactivo" }
              : c
          )
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado de sincronización");
    }
  };

  return (
    <div className="p-4 rounded-xl border bg-white shadow mb-6">
      <h2 className="text-xl font-bold mb-4">RFCs asociados</h2>

      {/* 🔍 BUSCADOR */}
      <input
        className="w-full border p-3 rounded-lg mb-4"
        placeholder="Buscar por RFC o nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Si no hay resultados */}
      {clientesVisibles.length === 0 && (
        <p className="text-gray-500 text-center py-4">No se encontraron resultados.</p>
      )}

      {/* 📜 LISTA CON SCROLL AUTOMÁTICO */}
      <div className="max-h-[350px] overflow-y-auto pr-2 mt-3">
        <ul className="divide-y">
          {clientesVisibles.map((c: any) => (
            <li
              key={c.rfc}
              className="py-3 flex justify-between items-center"
            >
              {/* INFO */}
              <div>
                <p className="font-mono">{c.rfc}</p>
                <p className="text-gray-500 text-sm">{c.nombre}</p>

                {!!c.syncStatus && (
                  <p
                    className={`text-xs mt-1 font-semibold ${
                      c.syncStatus === "error"
                        ? "text-red-500 flex items-center gap-1"
                        : c.syncStatus === "activo"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {c.syncStatus === "error" && <AlertCircle size={14} />}
                    Estado: {c.syncStatus}
                  </p>
                )}
              </div>

              {/* ACCIONES */}
              <div className="flex gap-3">

                {/* Si hay error en sync → botón de alerta */}
                {c.syncStatus === "error" && (
                  <button
                    onClick={() => setErrorModal({ rfc: c.rfc, nombre: c.nombre })}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                  >
                    <AlertCircle size={18} />
                  </button>
                )}

                {/* Desactivar descargas */}
                <button
                  onClick={() => toggleSync(c)}
                  className={`text-sm ${
                    c.syncPaused ? "text-green-600" : "text-red-600"
                  } hover:underline`}
                >
                  {c.syncPaused ? "Activar descargas" : "Desactivar descargas"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ⚠ MODAL DE ERROR */}
      {errorModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border relative">

            {/* Cerrar */}
            <button
              onClick={() => setErrorModal(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-red-600 mb-3 flex items-center gap-2">
              <XCircle size={22} /> Problemas con {errorModal.nombre}
            </h2>

            <p className="text-gray-700 leading-relaxed">
              Se detectaron problemas en la sincronización.
              Esto suele ocurrir cuando los certificados .cer/.key expiraron,
              la contraseña es incorrecta o el RFC no coincide.
              <br /><br />
              Revisa su configuración fiscal y vuelve a cargar sus archivos en el modulo de clientes.
            </p>

            <button
              onClick={() => setErrorModal(null)}
              className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
