"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { subscribeAddon, subscribePlan } from "../services/billingService";
import { toast } from "sonner";

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  plan: string | null;
  priceId: string | null;
}

export default function PaymentMethodModal({
  open,
  onClose,
  plan,
  priceId,
}: PaymentMethodModalProps) {
  if (!open || !priceId || !plan) return null;

  async function handleStripe() {
    try {
      // 🤖 BOT
      if (plan === "bot") {
        toast.message("Confirmar activación del bot", {
          description:
            "Este bot se agregará a tu suscripción y se cobrará mensualmente.",
          action: {
            label: "Activar",
            onClick: async () => {
              try {
                await subscribeAddon(String(priceId));
                toast.success("Bot activado correctamente");
                onClose();
              } catch (err: any) {
                toast.error(err.message || "No se pudo activar el bot");
              }
            },
          },
        });
        return;
      }
      // 🟢 PLAN
      const { url } = await subscribePlan(String(priceId));
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el pago");
    }
  }


  const handleTransfer = () => {
    const kind = plan === "bot" ? "bot" : "plan";
  
    window.location.href = `/plans/transfer?code=${priceId}&kind=${kind}`;
  };

  return (
    <AnimatePresence>
      {/* Fondo oscuro */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
        onClick={onClose}
      />

      {/* CONTENEDOR CENTRADO */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
        {/* MODAL */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 260 }}
          className="w-[95%] max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-700/60 
            shadow-2xl shadow-black/60 rounded-2xl p-7 text-slate-100 relative"
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Encabezado */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Selecciona método de pago
          </h2>

          <p className="text-slate-300 mt-1">
            Estás contratando:{" "}
            <span className="text-indigo-300 font-semibold">
              {plan === "bot" ? "Bot de WhatsApp" : plan}
            </span>
          </p>

          <div className="mt-6 space-y-4">
            {/* Tarjeta */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStripe}
              className="w-full py-3 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-indigo-400 to-cyan-300
                shadow-lg shadow-black/30 hover:opacity-90 transition"
            >
              Pagar con tarjeta
            </motion.button>

            {/* Transferencia */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleTransfer}
              className="w-full py-3 rounded-xl font-semibold bg-slate-800 border border-slate-600
                hover:bg-slate-700 transition text-slate-200"
            >
              Pago por transferencia
            </motion.button>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center">
            Podrás cambiar tu método de pago en cualquier momento.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
