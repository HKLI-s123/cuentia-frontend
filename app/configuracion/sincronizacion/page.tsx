"use client";

import { useEffect, useState } from "react";
import { getSessionInfo } from "@/app/services/authService";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function SyncSatPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSessionInfo();
        setSession(s);
      } catch (err) {
        toast.error("No se pudo cargar la sincronización con el SAT");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando sincronización…
      </div>
    );
  }

  if (!session) return <div>Error cargando datos...</div>;

  const status = session.syncStatus || "inactivo";

  // ------------------------------
  // ICONOS Y TEXTOS POR ESTADO
  // ------------------------------
  const renderStatus = () => {
    switch (status) {
      case "activo":
        return (
          <span className="flex items-center gap-2 text-green-600 font-semibold text-lg">
            <CheckCircle size={20} />
            Activo
          </span>
        );

      case "inactivo":
        return (
          <span className="flex items-center gap-2 text-gray-500 font-semibold text-lg">
            <XCircle size={20} />
            Inactivo
          </span>
        );

      case "error":
        return (
          <span className="flex items-center gap-2 text-red-600 font-semibold text-lg">
            <AlertTriangle size={20} />
            Error
          </span>
        );

      default:
        return (
          <span className="flex items-center gap-2 text-gray-500 font-semibold text-lg">
            Desconocido
          </span>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow border">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Sincronización SAT
      </h1>

      {/** ----------------------------- */}
      {/** ESTADO GENERAL */}
      {/** ----------------------------- */}
      <div className="p-4 border rounded-xl bg-gray-50 mb-6">
        <p className="text-gray-700 font-semibold mb-1">Estado actual</p>

        {renderStatus()}
      </div>

      {/** ----------------------------- */}
      {/** ÚLTIMA DESCARGA */}
      {/** ----------------------------- */}
      <div className="p-4 border rounded-xl bg-gray-50 mb-6">
        <p className="text-gray-700 font-semibold mb-1">Última descarga SAT</p>

        <p className="text-gray-600 text-lg">
          {session.lastSync
            ? new Date(session.lastSync).toLocaleString("es-MX")
            : "Aún no se ha realizado ninguna descarga"}
        </p>
      </div>

      {/** ----------------------------- */}
      {/** MENSAJE DE ERROR */}
      {/** ----------------------------- */}
        {status === "error" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Se detectaron problemas en la sincronización.</strong>
            <p className="mt-1">
              Esto suele ocurrir cuando los certificados .cer/.key expiraron,
              la contraseña es incorrecta o el RFC no coincide.
              Solicita a tu administrador la actualización de tus archivos.
            </p>
          </div>
        )}
    </div>
  );
}
