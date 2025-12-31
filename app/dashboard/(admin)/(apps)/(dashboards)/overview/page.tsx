"use client";

import { Container, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useOnboardingRedirect } from "../../../../../../hooks/useUserSessionGuard";

import PageBreadcrumb from "@/components/PageBreadcrumb";
import RevenueByClient from "./components/RevenueByClient";
import MainExpenses from "./components/MainExpenses";
import FinanceStats from "./components/FinanceStats";
import FinanceTrends from "./components/FinanceTrends";
import ExpensesByProvider from "./components/ExpensesByProvider";
import MainRevenue from "./components/MainRevenue";
import FiltersBar from "./components/FiltersBar";
import { withSessionGuard } from "@/app/providers/withSessionGuard";
import { getSessionInfo } from "@/app/services/authService";
import { activateGuest, validateGuestKey } from "@/app/services/chatService";
import { toast } from "sonner";

const Page = () => {
  const [session, setSession] = useState<any>(null);

  const [tipoCuenta, setTipoCuenta] = useState<"individual" | "empresarial" | "invitado" | "empleado" | null>(null);
  const [clientes, setClientes] = useState<{ rfc: string; nombre: string }[]>([]);
  const [selectedRfc, setSelectedRfc] = useState<string>("");

  const [invitePanelVisible, setInvitePanelVisible] = useState(false);
  const [guestKey, setGuestKey] = useState("");

  const [isNewAccount, setIsNewAccount] = useState(false); // 👈 NUEVO

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);

        console.log("yooo",data);

        // -------------------------------
        // 🆕 Validar si la cuenta es nueva (< 24h)
        // -------------------------------
        if (data.created_at) {
          const created = new Date(data.created_at).getTime();
          const now = Date.now();

          const hours = (now - created) / (1000 * 60 * 60);

          if (hours < 24) {
            setIsNewAccount(true);
          }
        }


      } catch (err: any) {
        console.error("Error cargando sesión:", err);

        // Si el backend devuelve 401 → no hay sesión → login
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("accessToken");
         // window.location.href = "/login";
          return;
        }

        // fallback por si otro error raro ocurre
       // window.location.href = "/login";
      }
    };

    load();
  }, []);

  // ------------------------------
  // 2) Redirección onboarding
  // ------------------------------
  useOnboardingRedirect(session);

  // ------------------------------
  // 3) Cuando session llega → cargar datos UI
  // ------------------------------
  useEffect(() => {
    if (!session) return;

    setTipoCuenta(session.tipoCuenta);
    setClientes(session.clientes);

    if (session.tipoCuenta === "individual" && session.clientes.length > 0) {
      setSelectedRfc(session.clientes[0].rfc);
      setInvitePanelVisible(false);
      return;
    }

    if (session.tipoCuenta === "invitado") {
      if (session.guestRfc) {
        setSelectedRfc(session.guestRfc);
        setInvitePanelVisible(false);
      } else {
        setInvitePanelVisible(true);
      }
      return;
    }
    if (session.tipoCuenta === "empresarial" || session.tipoCuenta === "empleado") {
      if (session.propioRFC) {
        setSelectedRfc(session.propioRFC);
      } else if (Array.isArray(session.clientes) && session.clientes.length > 0) {
        setSelectedRfc(session.clientes[0].rfc);
      } else {
        // 👇 No hay RFC disponible
        setSelectedRfc(""); // o undefined, según tu estado
      }
    
      setInvitePanelVisible(false);
      return;
    }
  }, [session]);

  // ------------------------------
  // 4) Render mientras carga
  // ------------------------------
  if (!session || tipoCuenta === null) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando tu cuenta...
      </div>
    );
  }

  // ------------------------------
  // 5) Vista invitado si no validó clave
  // ------------------------------
  if (tipoCuenta === "invitado" && invitePanelVisible) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center">
        <h2 className="text-xl font-bold">Acceso Invitado</h2>
        <p>Pega tu clave de invitado para continuar</p>

        <input
          type="text"
          className="border p-2 rounded-md w-64"
          placeholder="ej: 8d21ccxa33fe"
          value={guestKey}
          onChange={(e) => setGuestKey(e.target.value)}
        />

        <button
          className="px-4 py-2 bg-black text-white rounded-md"
          onClick={async () => {
            const cleaned = guestKey.trim();
            if (!cleaned) return toast.warning("Ingresa una clave");

            const result = await validateGuestKey(cleaned);
            if (!result) return toast.error("Clave inválida o bloqueada");

            try {
              await activateGuest(result.rfc);
              toast.success("Acceso habilitado");

              const refreshed = await getSessionInfo();
              setSession(refreshed);

              setSelectedRfc(refreshed.guestRfc || result.rfc);
              setInvitePanelVisible(false);
            } catch {
              toast.error("Error activando acceso invitado");
            }
          }}
        >
          Validar clave
        </button>
      </div>
    );
  }

  // ------------------------------
  // 6) Render normal
  // ------------------------------
  return (
    <Container fluid>
      <PageBreadcrumb title="Dashboard" />

      {/* -------------------------------------- */}
      {/* 🆕 7) Banner si la cuenta es nueva (<24h) */}
      {/* -------------------------------------- */}
      {isNewAccount &&
        tipoCuenta !== "empleado" &&
        Array.isArray(session?.clientes) &&
        session.clientes.length > 0 && (
          <div className="p-4 mb-4 rounded-xl bg-yellow-100 border border-yellow-300 text-yellow-800">
            <strong>Bienvenido 🎉</strong>
            <p className="mt-1 text-sm">
              Estamos realizando la sincronización inicial de tus CFDIs.  
              Este proceso puede tardar hasta 48 horas en completarse.
            </p>
          </div>
      )}

      {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && (
        <FiltersBar
          tipoCuenta="empresarial"
          selectedRfc={selectedRfc}
          setSelectedRfc={setSelectedRfc}
          rfcList={clientes}
        />
      )}

      <FinanceStats rfc={selectedRfc} />
      <FinanceTrends rfc={selectedRfc} />

      <Row>
        <RevenueByClient rfc={selectedRfc} />
        <ExpensesByProvider rfc={selectedRfc} />
      </Row>

      <MainExpenses rfc={selectedRfc} />
      <MainRevenue rfc={selectedRfc} />
    </Container>
  );
};

export default withSessionGuard(Page);
