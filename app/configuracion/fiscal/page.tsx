"use client";

import { useEffect, useState } from "react";
import { getSessionInfo } from "@/app/services/authService";
import Spinner from "@/components/Spinner";
import RFCPrincipalCard from "./components/RFCPrincipalCard";
import RfcListEmpresa from "./components/RfcListEmpresa";
import SyncStatus from "./components/SyncStatus";

export default function FiscalConfigPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  console.log(session);

  if (loading) return <Spinner />;
  if (!session) return <div>Error cargando sesión</div>;

  const { tipoCuenta, syncStatus } = session;

  const showUploadCard =
    tipoCuenta === "empresarial" ||
    tipoCuenta === "individual" ||
    syncStatus === "error";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 🚫 INVITADO */}
      {tipoCuenta === "invitado" && (
        <>
          <div className="text-center mt-20 text-gray-600">
            Esta sección solo está disponible para cuentas empresariales.
          </div>
        </>
      )}

      {/* 🔥 NO INVITADOS */}
      {tipoCuenta !== "invitado" && (
        <>
          <h1 className="text-3xl font-bold mb-8">Configuración fiscal</h1>

          {/* 🔥 RFCPrincipalCard:
              - Empresarial → normal
              - Individual → solo como botón "Actualizar certificados"
              - Error → siempre mostrarlo
          */}
          {showUploadCard && (
            <RFCPrincipalCard
              session={session}
              forceUpdateMode={tipoCuenta === "individual"}
            />
          )}

          <SyncStatus
             syncStatus={session.syncStatus}
             lastSync={session.lastSync}
           />

          {tipoCuenta === "empresarial" && (
            <RfcListEmpresa session={session} />
          )}
        </>
      )}
    </div>
  );
}
