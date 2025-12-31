import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toggleSync } from "../../../services/clientsService";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function SyncStatus({ syncStatus: initialStatus, lastSync }: any) {
  const [syncStatus, setSyncStatus] = useState<string | undefined>(undefined);

  // Si la sesión cambia desde fuera, sincronizar el estado local
  useEffect(() => {
    setSyncStatus(initialStatus);
  }, [initialStatus]);

  if (syncStatus === undefined) {
    return <div className="p-4">Cargando estado de sincronización...</div>;
  }

  const handleToggle = async () => {
    try {
      const data = await toggleSync(); // { syncStatus, syncPaused, message }

      setSyncStatus(data.syncStatus);

      toast.success(data.message);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar la sincronización");
    }
  };

  const renderStatus = () => {
    switch (syncStatus) {
      case "activo":
        return (
          <span className="flex items-center gap-2 text-green-600 font-semibold">
            <CheckCircle size={18} />
            Activo
          </span>
        );

      case "inactivo":
        return (
          <span className="flex items-center gap-2 text-gray-500 font-semibold">
            <XCircle size={18} />
            Inactivo
          </span>
        );

      case "error":
        return (
          <span className="flex items-center gap-2 text-red-600 font-semibold">
            <AlertTriangle size={18} />
            Error
          </span>
        );

      default:
        return "Desconocido";
    }
  };

  const isActive = syncStatus === "activo";
  const isError = syncStatus === "error";

  return (
    <div className="p-4 rounded-xl border bg-white shadow mb-6">
      <h2 className="text-xl font-bold">Sincronización CFDI / SAT</h2>

      <div className="mt-3 text-sm text-gray-700 space-y-2">
        <p><strong>Estado:</strong> {renderStatus()}</p>

        <p>
          <strong>Última descarga:</strong>{" "}
          {lastSync
            ? new Date(lastSync).toLocaleString("es-MX")
            : "No registrada"}
        </p>

        {/* Mensaje cuando syncStatus = error */}
        {isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Se detectaron problemas en la sincronización.</strong>
            <p className="mt-1">
              Esto suele ocurrir cuando los certificados .cer/.key expiraron,
              la contraseña es incorrecta o el RFC no coincide.
              Revisa tu configuración fiscal y vuelve a cargar tus archivos.
            </p>
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={isError}
          className={`mt-4 px-4 py-2 rounded-lg font-semibold transition w-full
            ${
              isError
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isActive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }
          `}
        >
          {isError
            ? "No disponible"
            : isActive
            ? "Desactivar descargas automáticas"
            : "Activar descargas automáticas"}
        </button>
      </div>
    </div>
  );
}
