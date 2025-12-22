import { useState } from "react";
import { toast } from "sonner";
import FielUploader from "./FielUploader";

export default function RFCPrincipalCard({ session }: any) {
  const [showFielModal, setShowFielModal] = useState(false);

   const tieneRFC = Boolean(session.propioRFC);

  const modalTitle = tieneRFC
    ? "Actualizar Firma Electrónica (FIEL)"
    : "Subir Firma Electrónica (FIEL)";

  const modalDescription = tieneRFC
    ? "Actualiza tus certificados FIEL para mantener activa la descarga automática del SAT."
    : "Sube tus certificados FIEL para comenzar la sincronización automática del SAT.";

  return (
    <div className="p-4 mb-6 rounded-xl border bg-white shadow">
      <h2 className="text-xl font-bold">RFC principal</h2>
      <p className="text-gray-600 mt-1">
        Este RFC se utiliza para tus dashboards y sincronización automática.
      </p>

      <div className="mt-4">
        <p className="font-mono text-lg">{session.propioRFC || "— Sin configurar —"}</p>
      </div>

      <button
        onClick={() => setShowFielModal(true)}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        {session.propioRFC ? "Actualizar certificados" : "Subir certificados"}
      </button>

      {showFielModal && (
        <FielUploader
          rfc={session.propioRFC}
          title={modalTitle}
          description={modalDescription}
          onClose={() => setShowFielModal(false)}
        />
      )}
    </div>
  );
}
