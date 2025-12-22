"use client";

import { useEffect, useState } from "react";
import { getSessionInfo, logoutUser } from "@/app/services/authService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  deleteAccount,
} from "@/app/services/dangerZoneService";
import { cancelSubscription, getBillingInfo } from "@/app/services/billingService";
import { apiFetch } from "@/app/services/apiClient";
import { applyRetentionDiscount } from "@/app/services/billingService";

type PlanInfo = {
  plan: string | null;
  status: "active" | "expired" | "canceled" | "none";
  currentPeriodEnd: string | null;
  paymentMethod: string | null; // 👈 AQUI
  paidMonths: number | null;
};

export default function DangerZonePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [password, setPassword] = useState("");
  const router = useRouter();

  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  
  const [billing, setBilling] = useState<any>(null);
  const [googleConfirmation, setGoogleConfirmation] = useState(""); // 👈 Agregado para Google
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSessionInfo();
        setSession(s);

        const b = await getBillingInfo();
        setBilling(b);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }

      try {
          const res = await apiFetch("http://localhost:3001/billing/me-plan");
          const data = await res?.json();
  
          const normalizedPlan = {
            plan: data?.plan ?? null,
            status: data?.status ?? "none", // active | canceled | expired | none
            currentPeriodEnd: data?.currentPeriodEnd ?? null,
            paymentMethod: data?.paymentMethod ?? null,
            paidMonths: data?.paidMonths ?? null,
          };
    
          setPlanInfo(normalizedPlan);
    
        } catch (err) {
          console.error("Error cargando plan:", err);
    
          // 🚑 Fallback seguro
          setPlanInfo({
            plan: null,
            status: "none",
            currentPeriodEnd: null,
            paymentMethod: null,
            paidMonths: null,
          });
        }
    };
    load();
  }, []);

  if (loading || !session) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        Cargando...
      </div>
    );
  }

  const isLocalProvider = session.provider === "local";
  const isGoogleProvider = session.provider === "google";

  const canCancel =
    planInfo?.plan !== "Free" && planInfo?.status !== "canceled";

    console.log(session.guestRfc);
  // =====================================
  // 🚫 RESTRICCIÓN: Invitado con propioRFC
  // =====================================
  const isInvitedLinkedToCompany =
    session.tipoCuenta === "invitado" && session.guestRfc;

    console.log(session.tipoCuenta)
  // =============================
  // 🟥 Eliminar cuenta
  // =============================
  const handleDelete = async () => {
    try {
      const confirmationValue = isLocalProvider
        ? password
        : isGoogleProvider
        ? googleConfirmation
        : undefined;

      await deleteAccount(confirmationValue);

      // 🔥 Cerrar sesión en backend y limpiar refreshToken
      await logoutUser();

      localStorage.removeItem("accessToken");

      toast.success("Cuenta eliminada correctamente");
    //  router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar la cuenta");
    }
  };

  // =============================
  // 🟧 Cancelar suscripción
  // =============================
  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      toast.success("Suscripción cancelada");
      setShowCancelModal(false);
    } catch {
      toast.error("Error cancelando suscripción");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow border">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Zona de Peligro</h1>

      <p className="text-gray-600 mb-6">
        Estas acciones no pueden deshacerse. Procede con cuidado.
      </p>

      {!canCancel && isInvitedLinkedToCompany && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-5 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800">
            No puedes realizar acciones desde esta sección
          </h2>
  
          <p className="text-yellow-700 mt-2 text-sm">
            Actualmente no tienes una suscripción activa y tu cuenta está vinculada
            a una empresa como invitado. La eliminación de tu cuenta debe solicitarse
            directamente al administrador.
          </p>
  
          <p className="text-yellow-700 mt-3 text-sm italic">
            Si necesitas asistencia, ponte en contacto con soporte.
          </p>
        </div>
      )}

      {/* ============================= */}
      {/* 🟧 Cancelar suscripción */}
      {/* ============================= */}
      {canCancel && (
        <div className="border border-orange-300 bg-orange-50 rounded-xl p-5 mb-8">
          <h2 className="text-lg font-semibold text-orange-800">
            Cancelar suscripción
          </h2>

          <p className="text-orange-700 mt-1 text-sm">
            Tu cuenta pasará al plan gratuito al finalizar tu ciclo actual.
          </p>
          <button
            onClick={() => setShowRetentionModal(true)}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Cancelar suscripción
          </button>
        </div>
      )}

      {/* ======================================= */}
      {/* 🟥 Eliminar cuenta — SOLO SI ES PERMITIDO */}
      {/* ======================================= */}
      {!isInvitedLinkedToCompany && (
        <div className="border border-red-300 bg-red-50 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-red-800">
            Eliminar permanentemente tu cuenta
          </h2>

          <p className="text-red-700 mt-1 text-sm">
            Esta acción eliminará todos tus datos, configuraciones y acceso a
            CuentIA.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Eliminar mi cuenta
          </button>
        </div>
      )}

      {/* ============================= */}
      {/* MODAL: Eliminar cuenta */}
      {/* ============================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Confirmar eliminación
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Esta acción eliminará permanentemente tu cuenta y no podrá
              deshacerse.
            </p>

            {/* LOCAL: pedir contraseña */}
            {isLocalProvider && (
              <>
                <label className="text-sm text-gray-700">
                  Ingresa tu contraseña
                </label>
                <input
                  type="password"
                  className="w-full border p-2 rounded-lg mt-2 mb-4"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            )}

            {/* GOOGLE: pedir confirmación visual */}
            {isGoogleProvider && (
              <>
                <p className="text-sm text-gray-700 mb-2">
                  Escribe <strong>ELIMINAR</strong> para confirmar.
                </p>
                <input
                  type="text"
                  className="w-full border p-2 rounded-lg mb-4"
                  placeholder="Escribe ELIMINAR"
                  value={googleConfirmation}
                  onChange={(e) => setGoogleConfirmation(e.target.value)}
                />
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {showRetentionModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
      
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Antes de que te vayas…
            </h2>
      
            <p className="text-gray-600 text-sm mb-4">
              Queremos mejorar CuentIA. ¿Nos ayudas diciendo por qué cancelas?
            </p>
      
            {/* Razones */}
            <div className="space-y-2 mb-4">
              {[
                "Muy caro",
                "No lo uso lo suficiente",
                "Falta una funcionalidad",
                "Problemas técnicos",
                "Ya no lo necesito",
                "Otro",
              ].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
      
            {/* Otro motivo */}
            {cancelReason === "Otro" && (
              <textarea
                className="w-full border rounded-lg p-2 text-sm mb-4"
                placeholder="Cuéntanos un poco más (opcional)"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}

            {/* 🎁 Oferta de retención */}
            {(planInfo?.paidMonths ?? 0 ) >= 3 && (
              <div className="mb-4 rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-sm">
                <p className="font-semibold text-indigo-700">
                  🎁 Oferta especial para ti
                </p>
                <p className="text-indigo-600 mt-1">
                  Podemos ofrecerte <strong>30% de descuento por 3 meses</strong> si
                  decides quedarte.
                </p>  
                  <button
                    disabled={applyingDiscount}
                    onClick={async () => {
                      try {
                        setApplyingDiscount(true);
                  
                        await applyRetentionDiscount(
                          cancelReason || "retention_discount_accepted",
                          customReason
                        );
                  
                        toast.success("Descuento aplicado. Gracias por quedarte.");
                        setShowRetentionModal(false);
                  
                        // Limpieza
                        setCancelReason("");
                        setCustomReason("");
                  
                      } catch (err: any) {
                        toast.error(err.message || "No se pudo aplicar el descuento");
                      } finally {
                        setApplyingDiscount(false);
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    Aplicar descuento y mantener plan
                  </button>
              </div>
            )}
      
            {/* Acciones */}
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowRetentionModal(false);
                  setCancelReason("");
                  setCustomReason("");
                }}
              >
                Volver
              </button>
      
              <button
                disabled={!cancelReason}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                onClick={() => {
                  setShowRetentionModal(false);
                  setShowCancelModal(true); // 👉 pasa a confirmación FINAL
                }}
              >
                Continuar con la cancelación
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================= */}
      {/* MODAL: Cancelar suscripción */}
      {/* ============================= */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Cancelar suscripción
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              ¿Seguro que deseas cancelar tu plan? Perderás beneficios al
              finalizar tu periodo actual.
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowCancelModal(false)}
              >
                Mantener plan
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleCancelSubscription}
              >
                Cancelar suscripción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
