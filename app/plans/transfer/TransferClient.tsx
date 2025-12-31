"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { submitManualTransfer } from "@/app/services/billingService";

export default function TransferPage() {
  const params = useSearchParams();
  const code = params.get("code");
  const kind = params.get("kind") as "plan" | "bot";

  // Referencia generada una sola vez
  const reference = useMemo(
    () => `TR-${Math.floor(100000 + Math.random() * 900000)}`,
    []
  );

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submitTransfer = async () => {
    try {
      setLoading(true);
  
      const result = await submitManualTransfer({
        code,
        kind,
        reference,
      });
  
      if (!result.ok && result.reason === "pending") {
        toast.error("Ya tienes una solicitud pendiente. Espera a que la validemos");
        setLoading(false);
        return;
      }
  
      if (result.ok) {
        setSent(true);
        return;
      }
  
      toast.error("No se pudo registrar el pago. Intenta más tarde.");
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {!sent ? (
          /* FORMULARIO */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 p-8 rounded-2xl shadow-xl shadow-black/40"
          >
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Pago por transferencia
            </h1>

            <p className="text-slate-300 mb-6">
              Estás contratando el plan{" "}
              <span className="font-semibold text-indigo-300">{kind}</span>.
              Por favor realiza la transferencia usando los siguientes datos:
            </p>

            {/* DATOS DE LA TRANSFERENCIA */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 mb-6 shadow-inner">
              <p className="mb-1">
                <b className="text-indigo-300">Banco:</b> BBVA
              </p>
              <p className="mb-1">
                <b className="text-indigo-300">CLABE:</b> 012164015504841260
              </p>
              <p className="mt-2">
                <b className="text-indigo-300">Referencia:</b>{" "}
                <span className="font-mono bg-slate-900 px-2 py-1 rounded">
                  {reference}
                </span>
              </p>
            </div>

            <p className="text-slate-400 text-sm mb-6">
              Una vez hecho el pago, presiona{" "}
              <b className="text-indigo-300">"Ya pagué"</b> para que podamos
              validar la transferencia y activar tu plan.
            </p>

            {/* BOTÓN */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={submitTransfer}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-900 
              font-semibold shadow-lg shadow-black/40 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Ya pagué"}
            </motion.button>
          </motion.div>
        ) : (
          /* PANTALLA DE ÉXITO */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 p-10 rounded-2xl shadow-xl shadow-black/40 text-center"
          >
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold mb-2 text-emerald-300">
              Solicitud enviada
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Hemos recibido tu notificación de pago por transferencia.
              <br />
              Validaremos la operación y activaremos tu plan lo antes posible.
            </p>

            <div className="mt-6">
              <a
                href="/dashboard/overview"
                className="text-indigo-300 hover:text-indigo-200 underline text-sm"
              >
                Volver al dashboard
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
